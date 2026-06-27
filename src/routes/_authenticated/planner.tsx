import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateStudyPlan } from "@/lib/study.functions";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Sparkles, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Planner — AI Study Planner" }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const generate = useServerFn(generateStudyPlan);

  const today = new Date().toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [title, setTitle] = useState("My study plan");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(twoWeeks);
  const [minutes, setMinutes] = useState(120);
  const [focus, setFocus] = useState("");

  const plans = useQuery({
    queryKey: ["plans", user.id],
    queryFn: async () => (await supabase.from("study_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });

  const subjectsCount = useQuery({
    queryKey: ["subjects-count", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id", { count: "exact", head: true }).eq("user_id", user.id)).count ?? 0,
  });

  const mut = useMutation({
    mutationFn: () => generate({ data: { title, start_date: start, end_date: end, daily_minutes: minutes, focus } }),
    onSuccess: (r) => {
      toast.success(`Plan ready — ${r.task_count} tasks scheduled`);
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl flex items-center gap-2"><Wand2 className="size-7 text-primary" /> AI Planner</h1>
        <p className="text-muted-foreground">Tell us your goals — we'll build a personalized day-by-day plan.</p>
      </header>

      {subjectsCount.data === 0 && (
        <Card className="p-5 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm">Add at least one subject before generating a plan. <Link to="/subjects" className="text-primary underline">Add a subject →</Link></p>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-5">
          <div className="space-y-2"><Label>Plan title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Start date</Label><Input type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-2"><Label>End date</Label><Input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            <div className="space-y-2"><Label>Daily minutes</Label><Input type="number" min={15} max={720} required value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-2">
            <Label>Focus & context (optional)</Label>
            <Textarea rows={3} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. I'm weakest in integration; mornings are best for math." />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={mut.isPending || subjectsCount.data === 0} className="gap-2">
              {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Generating...</> : <><Sparkles className="size-4" /> Generate plan</>}
            </Button>
            <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><ListChecks className="size-4" /> Your plans</h2>
        {plans.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans yet.</p>
        ) : (
          <div className="grid gap-3">
            {plans.data?.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(p.start_date), "MMM d")} → {format(parseISO(p.end_date), "MMM d, yyyy")}
                    </p>
                    {p.summary && <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{p.summary}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
