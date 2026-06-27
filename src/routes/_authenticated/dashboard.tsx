import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toggleTaskComplete } from "@/lib/study.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Target, CalendarDays, Wand2, BookOpen, Loader2 } from "lucide-react";
import { format, differenceInCalendarDays, isToday, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Study Planner" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const toggle = useServerFn(toggleTaskComplete);

  const today = new Date().toISOString().slice(0, 10);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const todayTasks = useQuery({
    queryKey: ["tasks", "today", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_tasks")
        .select("id,title,duration_minutes,status,priority,subject_id,scheduled_date,description")
        .eq("user_id", user.id)
        .eq("scheduled_date", today)
        .order("priority", { ascending: false });
      return data ?? [];
    },
  });

  const upcomingExams = useQuery({
    queryKey: ["exams", "upcoming", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("exams")
        .select("id,title,exam_date,importance")
        .eq("user_id", user.id)
        .gte("exam_date", today)
        .order("exam_date", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  const weekStats = useQuery({
    queryKey: ["weekstats", user.id],
    queryFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const { data } = await supabase
        .from("study_tasks")
        .select("status,duration_minutes,scheduled_date")
        .eq("user_id", user.id)
        .gte("scheduled_date", start.toISOString().slice(0, 10));
      const tasks = data ?? [];
      const completed = tasks.filter((t) => t.status === "completed").length;
      const total = tasks.length;
      const minutes = tasks.filter((t) => t.status === "completed").reduce((a, t) => a + (t.duration_minutes || 0), 0);
      return { completed, total, minutes, rate: total ? Math.round((completed / total) * 100) : 0 };
    },
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; completed: boolean }) => toggle({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["weekstats"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const goal = profile.data?.daily_study_minutes_goal ?? 120;
  const todayMinutes = (todayTasks.data ?? []).filter((t) => t.status === "completed").reduce((a, t) => a + (t.duration_minutes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="font-display text-4xl">Hi {profile.data?.full_name?.split(" ")[0] ?? "there"} 👋</h1>
        </div>
        <Link to="/planner">
          <Button className="gap-2"><Wand2 className="size-4" /> Generate new plan</Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Streak" value={`${profile.data?.streak_days ?? 0} days`} accent="from-orange-500 to-rose-500" />
        <StatCard icon={Trophy} label="Total XP" value={`${profile.data?.xp ?? 0}`} accent="from-amber-400 to-orange-500" />
        <StatCard icon={Target} label="This week" value={`${weekStats.data?.rate ?? 0}%`} accent="from-primary to-secondary" sub={`${weekStats.data?.completed ?? 0}/${weekStats.data?.total ?? 0} tasks`} />
        <StatCard icon={CalendarDays} label="Next exam" value={upcomingExams.data?.[0] ? `${differenceInCalendarDays(parseISO(upcomingExams.data[0].exam_date), new Date())}d` : "—"} accent="from-cyan-500 to-blue-500" sub={upcomingExams.data?.[0]?.title} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's tasks</h2>
            <span className="text-sm text-muted-foreground">{todayMinutes} / {goal} min</span>
          </div>
          <Progress value={Math.min(100, (todayMinutes / goal) * 100)} className="mb-6" />
          {todayTasks.isLoading ? (
            <div className="py-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : (todayTasks.data ?? []).length === 0 ? (
            <EmptyState
              icon={Wand2}
              title="No tasks scheduled for today"
              cta={<Link to="/planner"><Button size="sm">Build your AI plan</Button></Link>}
            />
          ) : (
            <ul className="divide-y">
              {todayTasks.data!.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-3">
                  <Checkbox
                    checked={t.status === "completed"}
                    onCheckedChange={(c) => mutate.mutate({ id: t.id, completed: !!c })}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">{t.duration_minutes}m</Badge>
                    {t.priority >= 4 && <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20" variant="outline">High</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="size-4" /> Upcoming exams</h2>
          {(upcomingExams.data ?? []).length === 0 ? (
            <EmptyState icon={CalendarDays} title="No exams yet" cta={<Link to="/exams"><Button size="sm" variant="outline">Add exam</Button></Link>} />
          ) : (
            <ul className="space-y-3">
              {upcomingExams.data!.map((e) => {
                const days = differenceInCalendarDays(parseISO(e.exam_date), new Date());
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(e.exam_date), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant={days <= 7 ? "destructive" : "secondary"}>
                      {isToday(parseISO(e.exam_date)) ? "Today" : `${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/exams" className="text-sm text-primary hover:underline mt-4 inline-block">Manage exams →</Link>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="size-4" /> Quick links</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <QuickLink to="/subjects" icon={BookOpen} title="Subjects" desc="Add or edit subjects" />
          <QuickLink to="/exams" icon={CalendarDays} title="Exams" desc="Track upcoming exams" />
          <QuickLink to="/planner" icon={Wand2} title="AI Planner" desc="Generate a new plan" />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string; sub?: string }) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className={`absolute -top-6 -right-6 size-24 rounded-full bg-gradient-to-br ${accent} opacity-15 blur-xl`} />
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Icon className="size-3.5" />{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>}
    </Card>
  );
}

function EmptyState({ icon: Icon, title, cta }: { icon: React.ComponentType<{ className?: string }>; title: string; cta?: React.ReactNode }) {
  return (
    <div className="py-8 grid place-items-center text-center gap-3">
      <div className="size-10 rounded-full bg-muted grid place-items-center"><Icon className="size-5 text-muted-foreground" /></div>
      <p className="text-sm text-muted-foreground">{title}</p>
      {cta}
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: "/subjects" | "/exams" | "/planner"; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="group block rounded-lg border p-4 hover:border-primary/40 hover:bg-muted/50 transition">
      <Icon className="size-5 text-primary mb-2" />
      <p className="font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
