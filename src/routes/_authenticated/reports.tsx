import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, isWithinInterval } from "date-fns";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — AI Study Planner" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = Route.useRouteContext();
  const [period, setPeriod] = useState<"week" | "month">("week");

  const range = useMemo(() => {
    const now = new Date();
    if (period === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [period]);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const sessions = useQuery({
    queryKey: ["report-sessions", user.id, period],
    queryFn: async () => (await supabase
      .from("study_sessions")
      .select("started_at,duration_minutes,subject_id")
      .eq("user_id", user.id)
      .gte("started_at", range.start.toISOString())
      .lte("started_at", range.end.toISOString())).data ?? [],
  });

  const tasks = useQuery({
    queryKey: ["report-tasks", user.id, period],
    queryFn: async () => (await supabase
      .from("study_tasks")
      .select("status,scheduled_date,duration_minutes,title,subject_id")
      .eq("user_id", user.id)
      .gte("scheduled_date", format(range.start, "yyyy-MM-dd"))
      .lte("scheduled_date", format(range.end, "yyyy-MM-dd"))).data ?? [],
  });

  const subjects = useQuery({
    queryKey: ["subjects", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id,name,color").eq("user_id", user.id)).data ?? [],
  });

  const stats = useMemo(() => {
    const totalMin = (sessions.data ?? []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
    const tasksDone = (tasks.data ?? []).filter((t) => t.status === "completed").length;
    const tasksTotal = (tasks.data ?? []).length;
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    const dayMap = new Map(days.map((d) => [format(d, "yyyy-MM-dd"), 0]));
    (sessions.data ?? []).forEach((s) => {
      const k = format(parseISO(s.started_at), "yyyy-MM-dd");
      if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) ?? 0) + (s.duration_minutes || 0));
    });
    const active = Array.from(dayMap.values()).filter((v) => v > 0).length;
    const subjMap = new Map<string, number>();
    (sessions.data ?? []).forEach((s) => {
      if (!s.subject_id) return;
      subjMap.set(s.subject_id, (subjMap.get(s.subject_id) ?? 0) + (s.duration_minutes || 0));
    });
    const subjectName = new Map((subjects.data ?? []).map((s) => [s.id, s.name]));
    const bySubject = Array.from(subjMap.entries()).map(([id, mins]) => ({ name: subjectName.get(id) ?? "Other", minutes: mins })).sort((a, b) => b.minutes - a.minutes);
    return { totalMin, tasksDone, tasksTotal, active, totalDays: days.length, bySubject };
  }, [sessions.data, tasks.data, subjects.data, range]);

  void isWithinInterval; // imported for future use; quiet warning

  const exportCsv = () => {
    const rows = [["Date", "Title", "Status", "Duration (min)"]];
    (tasks.data ?? []).forEach((t) => rows.push([t.scheduled_date, t.title, t.status, String(t.duration_minutes)]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-report-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><FileText className="size-7 text-primary" /> Reports</h1>
          <p className="text-muted-foreground">Summarized progress you can print or export.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border p-1 flex">
            <Button variant={period === "week" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("week")}>This week</Button>
            <Button variant={period === "month" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("month")}>This month</Button>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="size-4" /> CSV</Button>
          <Button size="sm" onClick={() => window.print()} className="gap-2"><Printer className="size-4" /> Print / PDF</Button>
        </div>
      </header>

      <div id="report" className="space-y-6 print:space-y-4">
        <Card className="p-6 print:shadow-none print:border-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{period === "week" ? "Weekly" : "Monthly"} report</p>
              <h2 className="font-display text-2xl">{profile.data?.full_name ?? user.email}</h2>
              <p className="text-sm text-muted-foreground">{format(range.start, "MMM d, yyyy")} → {format(range.end, "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Study time" value={`${Math.round(stats.totalMin / 60)}h ${stats.totalMin % 60}m`} />
            <Metric label="Tasks done" value={`${stats.tasksDone}/${stats.tasksTotal}`} />
            <Metric label="Active days" value={`${stats.active}/${stats.totalDays}`} />
            <Metric label="Total XP" value={`${profile.data?.xp ?? 0}`} />
          </div>
        </Card>

        <Card className="p-6 print:shadow-none print:border-0">
          <h3 className="font-semibold mb-3">Time by subject</h3>
          {stats.bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subject-tagged sessions in this period.</p>
          ) : (
            <ul className="space-y-2">
              {stats.bySubject.map((s) => (
                <li key={s.name} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium tabular-nums">{Math.round(s.minutes / 60)}h {s.minutes % 60}m</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 print:shadow-none print:border-0">
          <h3 className="font-semibold mb-3">Tasks ({tasks.data?.length ?? 0})</h3>
          {(tasks.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks scheduled this period.</p>
          ) : (
            <ul className="divide-y text-sm">
              {tasks.data!.map((t, i) => (
                <li key={i} className="py-2 flex justify-between gap-3">
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-muted-foreground">{t.scheduled_date}</span>
                  <span className={t.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}>{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <style>{`@media print { aside, header.md\\:hidden, nav { display: none !important; } body { background: white; } }`}</style>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
