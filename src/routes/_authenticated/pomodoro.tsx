import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startSession, endSession } from "@/lib/sessions.functions";
import { syncProgress } from "@/lib/gamification.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer, Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { celebrateAchievements } from "@/components/AchievementToast";

export const Route = createFileRoute("/_authenticated/pomodoro")({
  head: () => ({ meta: [{ title: "Pomodoro — AI Study Planner" }] }),
  component: PomodoroPage,
});

type Phase = "work" | "break" | "longBreak";

function PomodoroPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const startFn = useServerFn(startSession);
  const endFn = useServerFn(endSession);
  const sync = useServerFn(syncProgress);

  const settings = useQuery({
    queryKey: ["user-settings", user.id],
    queryFn: async () => (await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()).data,
  });

  const [mode, setMode] = useState<"25/5" | "50/10" | "custom">("25/5");
  const [work, setWork] = useState(25);
  const [brk, setBrk] = useState(5);
  const [longBrk, setLongBrk] = useState(15);

  useEffect(() => {
    if (settings.data) {
      setWork(settings.data.pomodoro_work_minutes);
      setBrk(settings.data.pomodoro_break_minutes);
      setLongBrk(settings.data.pomodoro_long_break_minutes);
    }
  }, [settings.data]);

  useEffect(() => {
    if (mode === "25/5") { setWork(25); setBrk(5); }
    if (mode === "50/10") { setWork(50); setBrk(10); }
  }, [mode]);

  const subjects = useQuery({
    queryKey: ["subjects", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id,name,color").eq("user_id", user.id).order("name")).data ?? [],
  });

  const [subjectId, setSubjectId] = useState("none");
  const [phase, setPhase] = useState<Phase>("work");
  const [running, setRunning] = useState(false);
  const [completedWork, setCompletedWork] = useState(0);
  const [remaining, setRemaining] = useState(work * 60);
  const [sessionDbId, setSessionDbId] = useState<string | null>(null);
  const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseMinutes = useMemo(() => (phase === "work" ? work : phase === "break" ? brk : longBrk), [phase, work, brk, longBrk]);
  useEffect(() => { if (!running) setRemaining(phaseMinutes * 60); }, [phaseMinutes, running]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          handlePhaseEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.2;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 250);
    } catch { /* ignore */ }
  };

  const handlePhaseEnd = async () => {
    beep();
    setRunning(false);
    if (phase === "work") {
      // Save a study_session for the completed work block
      if (sessionDbId && phaseStartedAt) {
        const mins = Math.max(1, Math.round((Date.now() - phaseStartedAt) / 60000));
        try {
          await endFn({ data: { id: sessionDbId, duration_minutes: mins } });
          const res = await sync({ data: undefined as any });
          celebrateAchievements(res.newly_earned);
          qc.invalidateQueries({ queryKey: ["sessions-history"] });
          qc.invalidateQueries({ queryKey: ["profile"] });
        } catch (e: any) { toast.error(e.message); }
      }
      setSessionDbId(null); setPhaseStartedAt(null);
      const next = completedWork + 1;
      setCompletedWork(next);
      const nextPhase: Phase = next % 4 === 0 ? "longBreak" : "break";
      setPhase(nextPhase);
      setRemaining((nextPhase === "longBreak" ? longBrk : brk) * 60);
      toast.success("Work block complete — take a break ☕");
    } else {
      setPhase("work");
      setRemaining(work * 60);
      toast.success("Break over — back to focus");
    }
  };

  const startTimer = async () => {
    if (phase === "work" && !sessionDbId) {
      try {
        const row: any = await startFn({ data: { subject_id: subjectId === "none" ? null : subjectId } });
        setSessionDbId(row.id);
        setPhaseStartedAt(Date.now());
      } catch (e: any) { toast.error(e.message); return; }
    }
    setRunning(true);
  };

  const reset = async () => {
    setRunning(false);
    if (sessionDbId && phaseStartedAt) {
      const mins = Math.max(0, Math.round((Date.now() - phaseStartedAt) / 60000));
      if (mins > 0) {
        try {
          await endFn({ data: { id: sessionDbId, duration_minutes: mins } });
          qc.invalidateQueries({ queryKey: ["sessions-history"] });
        } catch { /* ignore */ }
      }
    }
    setSessionDbId(null); setPhaseStartedAt(null);
    setPhase("work");
    setRemaining(work * 60);
  };

  const skip = () => handlePhaseEnd();

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = phaseMinutes ? 1 - remaining / (phaseMinutes * 60) : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><Timer className="size-7 text-primary" /> Pomodoro Timer</h1>
        <p className="text-muted-foreground">Focused work, then deliberate rest.</p>
      </header>

      <Card className="p-6 md:p-10 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["25/5", "50/10", "custom"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>{m}</Button>
          ))}
        </div>

        {mode === "custom" && (
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div><Label>Work (min)</Label><Input type="number" min={1} max={180} value={work} onChange={(e) => setWork(Number(e.target.value) || 1)} /></div>
            <div><Label>Break</Label><Input type="number" min={1} max={60} value={brk} onChange={(e) => setBrk(Number(e.target.value) || 1)} /></div>
            <div><Label>Long break</Label><Input type="number" min={1} max={60} value={longBrk} onChange={(e) => setLongBrk(Number(e.target.value) || 1)} /></div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {phase === "work" ? "Focus" : phase === "break" ? "Short break" : "Long break"} · #{completedWork + (phase === "work" ? 1 : 0)}
          </p>
          <div className="relative size-64 md:size-72 mx-auto my-4">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="4" />
              <circle cx="50" cy="50" r="46" fill="none"
                stroke={phase === "work" ? "#2563EB" : "#10B981"} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${pct * 289} 289`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-5xl md:text-6xl tabular-nums">{fmt(remaining)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {running ? (
              <Button size="lg" variant="secondary" onClick={() => setRunning(false)} className="gap-2"><Pause className="size-4" /> Pause</Button>
            ) : (
              <Button size="lg" onClick={startTimer} className="gap-2"><Play className="size-4" /> Start</Button>
            )}
            <Button size="lg" variant="outline" onClick={reset} className="gap-2"><RotateCcw className="size-4" /> Reset</Button>
            <Button size="lg" variant="ghost" onClick={skip} className="gap-2"><SkipForward className="size-4" /> Skip</Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <Label className="mb-2 block">Subject for this session</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-2">Focus stats (today)</h2>
        <p className="text-sm text-muted-foreground">Completed work blocks: <span className="font-semibold text-foreground">{completedWork}</span> · Focused minutes: <span className="font-semibold text-foreground">{completedWork * work}</span></p>
      </Card>
    </div>
  );
}
