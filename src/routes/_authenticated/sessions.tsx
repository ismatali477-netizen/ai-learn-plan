import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startSession, endSession, deleteSession } from "@/lib/sessions.functions";
import { syncProgress } from "@/lib/gamification.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, Square, Trash2, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { celebrateAchievements } from "@/components/AchievementToast";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({ meta: [{ title: "Study Sessions — AI Study Planner" }] }),
  component: SessionsPage,
});

function SessionsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const startFn = useServerFn(startSession);
  const endFn = useServerFn(endSession);
  const delFn = useServerFn(deleteSession);
  const sync = useServerFn(syncProgress);

  const [subjectId, setSubjectId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("active_session_id");
  });
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("active_session_started");
    return v ? Number(v) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    tick.current = setInterval(update, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [startedAt]);

  const subjects = useQuery({
    queryKey: ["subjects", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id,name,color").eq("user_id", user.id).order("name")).data ?? [],
  });

  const history = useQuery({
    queryKey: ["sessions-history", user.id],
    queryFn: async () => (await supabase
      .from("study_sessions")
      .select("id,started_at,ended_at,duration_minutes,notes,subject_id")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50)).data ?? [],
  });

  const start = useMutation({
    mutationFn: () => startFn({ data: { subject_id: subjectId === "none" ? null : subjectId, notes: notes || undefined } }),
    onSuccess: (row: any) => {
      setActiveId(row.id);
      const ts = Date.now();
      setStartedAt(ts);
      localStorage.setItem("active_session_id", row.id);
      localStorage.setItem("active_session_started", String(ts));
      toast.success("Session started");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stop = useMutation({
    mutationFn: async () => {
      if (!activeId || !startedAt) throw new Error("No active session");
      const mins = Math.max(0, Math.round((Date.now() - startedAt) / 60000));
      await endFn({ data: { id: activeId, duration_minutes: mins, notes: notes || undefined } });
      const res = await sync({ data: undefined as any });
      return { mins, res };
    },
    onSuccess: ({ mins, res }) => {
      toast.success(`Session saved — ${mins} min · +${Math.round(mins / 2)} XP`);
      celebrateAchievements(res.newly_earned);
      setActiveId(null); setStartedAt(null); setElapsed(0); setNotes("");
      localStorage.removeItem("active_session_id");
      localStorage.removeItem("active_session_started");
      qc.invalidateQueries({ queryKey: ["sessions-history"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["analytics-sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["sessions-history"] }); },
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><Timer className="size-7 text-primary" /> Study Sessions</h1>
        <p className="text-muted-foreground">Track focused study time. 1 XP per 2 minutes.</p>
      </header>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        {activeId ? (
          <div className="text-center space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">In progress</p>
            <div className="font-display text-6xl md:text-7xl tabular-nums">{formatHMS(elapsed)}</div>
            <Button size="lg" onClick={() => stop.mutate()} disabled={stop.isPending} className="gap-2">
              <Square className="size-4" /> {stop.isPending ? "Saving..." : "End session"}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="No subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What are you working on?" />
            </div>
            <div className="md:col-span-2">
              <Button size="lg" className="gap-2" onClick={() => start.mutate()} disabled={start.isPending}>
                <Play className="size-4" /> Start session
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock className="size-4" /> History</h2>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (history.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <ul className="divide-y">
            {history.data!.map((s) => {
              const subj = subjects.data?.find((x) => x.id === s.subject_id);
              return (
                <li key={s.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{format(parseISO(s.started_at), "MMM d, p")}</span>
                      {subj && <Badge variant="secondary" style={{ borderLeft: `3px solid ${subj.color}` }}>{subj.name}</Badge>}
                    </div>
                    {s.notes && <p className="text-sm text-muted-foreground line-clamp-1">{s.notes}</p>}
                  </div>
                  <Badge>{s.duration_minutes}m</Badge>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function formatHMS(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
