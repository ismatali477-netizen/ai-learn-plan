import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Activity, Loader2 } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, parseISO, eachDayOfInterval, differenceInCalendarDays } from "date-fns";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AI Study Planner" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#2563EB", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6"];

function AnalyticsPage() {
  const { user } = Route.useRouteContext();
  const since = subDays(new Date(), 89);
  const sinceStr = since.toISOString();

  const sessions = useQuery({
    queryKey: ["analytics-sessions", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("started_at,duration_minutes,subject_id")
        .eq("user_id", user.id)
        .gte("started_at", sinceStr);
      return data ?? [];
    },
  });

  const tasks = useQuery({
    queryKey: ["analytics-tasks", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_tasks")
        .select("status,scheduled_date,completed_at,duration_minutes,subject_id,exam_id")
        .eq("user_id", user.id)
        .gte("scheduled_date", since.toISOString().slice(0, 10));
      return data ?? [];
    },
  });

  const subjects = useQuery({
    queryKey: ["analytics-subjects", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id,name,color").eq("user_id", user.id)).data ?? [],
  });

  const exams = useQuery({
    queryKey: ["analytics-exams", user.id],
    queryFn: async () => (await supabase.from("exams").select("id,title,exam_date").eq("user_id", user.id).gte("exam_date", new Date().toISOString().slice(0, 10))).data ?? [],
  });

  const loading = sessions.isLoading || tasks.isLoading || subjects.isLoading;

  const data = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const dailyMap = new Map<string, { date: string; minutes: number; tasks: number; completed: number }>();
    days.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      dailyMap.set(key, { date: format(d, "MMM d"), minutes: 0, tasks: 0, completed: 0 });
    });
    (sessions.data ?? []).forEach((s) => {
      const key = format(parseISO(s.started_at), "yyyy-MM-dd");
      const row = dailyMap.get(key);
      if (row) row.minutes += s.duration_minutes || 0;
    });
    (tasks.data ?? []).forEach((t) => {
      const row = dailyMap.get(t.scheduled_date);
      if (row) {
        row.tasks++;
        if (t.status === "completed") row.completed++;
      }
    });
    const daily = Array.from(dailyMap.values());

    // Weekly aggregation (last 8 weeks)
    const weeklyMap = new Map<string, { week: string; minutes: number }>();
    (sessions.data ?? []).forEach((s) => {
      const wk = format(startOfWeek(parseISO(s.started_at), { weekStartsOn: 1 }), "MMM d");
      weeklyMap.set(wk, { week: wk, minutes: (weeklyMap.get(wk)?.minutes ?? 0) + (s.duration_minutes || 0) });
    });
    const weekly = Array.from(weeklyMap.values()).slice(-8);

    // Monthly progress (last 6 months) — % tasks completed
    const monthlyMap = new Map<string, { month: string; total: number; done: number }>();
    (tasks.data ?? []).forEach((t) => {
      const m = format(startOfMonth(parseISO(t.scheduled_date)), "MMM yy");
      const cur = monthlyMap.get(m) ?? { month: m, total: 0, done: 0 };
      cur.total++;
      if (t.status === "completed") cur.done++;
      monthlyMap.set(m, cur);
    });
    const monthly = Array.from(monthlyMap.values()).map((r) => ({ month: r.month, rate: r.total ? Math.round((r.done / r.total) * 100) : 0 }));

    // Subject performance
    const subjectName = new Map((subjects.data ?? []).map((s) => [s.id, s.name]));
    const subjectColor = new Map((subjects.data ?? []).map((s) => [s.id, s.color]));
    const perSubject = new Map<string, { name: string; minutes: number; color: string }>();
    (sessions.data ?? []).forEach((s) => {
      if (!s.subject_id) return;
      const name = subjectName.get(s.subject_id) ?? "Other";
      const cur = perSubject.get(s.subject_id) ?? { name, minutes: 0, color: subjectColor.get(s.subject_id) ?? "#888" };
      cur.minutes += s.duration_minutes || 0;
      perSubject.set(s.subject_id, cur);
    });
    const bySubject = Array.from(perSubject.values()).sort((a, b) => b.minutes - a.minutes);

    // Consistency score: % of last 30 days with any activity
    const activeDays = daily.filter((d) => d.minutes > 0 || d.completed > 0).length;
    const consistency = Math.round((activeDays / 30) * 100);

    // Totals
    const totalMinutes = (sessions.data ?? []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
    const totalCompleted = (tasks.data ?? []).filter((t) => t.status === "completed").length;
    const totalTasks = (tasks.data ?? []).length;

    return { daily, weekly, monthly, bySubject, consistency, totalMinutes, totalCompleted, totalTasks };
  }, [sessions.data, tasks.data, subjects.data]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><BarChart3 className="size-7 text-primary" /> Analytics</h1>
        <p className="text-muted-foreground">Insight into your last 90 days of study.</p>
      </header>

      {loading ? (
        <Card className="p-10 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Activity} label="Total study time" value={`${Math.round(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m`} />
            <Stat icon={Target} label="Tasks completed" value={`${data.totalCompleted}/${data.totalTasks}`} />
            <Stat icon={TrendingUp} label="Consistency (30d)" value={`${data.consistency}%`} />
            <Stat icon={BarChart3} label="Active subjects" value={`${data.bySubject.length}`} />
          </div>

          <Card className="p-4 md:p-6">
            <h2 className="font-semibold mb-4">Daily study minutes (30 days)</h2>
            <ChartFrame>
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="date" interval={4} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                <Area dataKey="minutes" stroke="#2563EB" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ChartFrame>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6">
              <h2 className="font-semibold mb-4">Weekly hours</h2>
              <ChartFrame>
                <BarChart data={data.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                  <Tooltip formatter={(v: number) => `${Math.round(v / 60)}h ${v % 60}m`} contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="minutes" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartFrame>
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="font-semibold mb-4">Monthly completion rate</h2>
              <ChartFrame>
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
                  <Line dataKey="rate" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ChartFrame>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6">
              <h2 className="font-semibold mb-4">Subject performance</h2>
              {data.bySubject.length === 0 ? (
                <p className="text-sm text-muted-foreground">Log a session linked to a subject to populate this chart.</p>
              ) : (
                <ChartFrame>
                  <PieChart>
                    <Pie data={data.bySubject} dataKey="minutes" nameKey="name" innerRadius={50} outerRadius={90}>
                      {data.bySubject.map((s, i) => <Cell key={i} fill={s.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} min`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ChartFrame>
              )}
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="font-semibold mb-4">Task completion trend (30d)</h2>
              <ChartFrame>
                <BarChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="date" interval={4} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="completed" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} name="Completed" />
                  <Bar dataKey="tasks" stackId="a" fill="#E5E7EB" name="Scheduled" />
                </BarChart>
              </ChartFrame>
            </Card>
          </div>

          <Card className="p-4 md:p-6">
            <h2 className="font-semibold mb-4">Exam preparation progress</h2>
            {(exams.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams.</p>
            ) : (
              <ul className="space-y-3">
                {exams.data!.map((e) => {
                  const examTasks = (tasks.data ?? []).filter((t) => t.exam_id === e.id);
                  const done = examTasks.filter((t) => t.status === "completed").length;
                  const total = examTasks.length;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  const days = differenceInCalendarDays(parseISO(e.exam_date), new Date());
                  return (
                    <li key={e.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate">{e.title}</span>
                        <span className="text-muted-foreground">{done}/{total} tasks · {days}d left</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Icon className="size-3.5" />{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

function ChartFrame({ children }: { children: React.ReactElement }) {
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}
