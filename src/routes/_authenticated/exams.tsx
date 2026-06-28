import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { syncProgress } from "@/lib/gamification.functions";
import { celebrateAchievements } from "@/components/AchievementToast";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Exams — AI Study Planner" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const sync = useServerFn(syncProgress);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [importance, setImportance] = useState(3);
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [topics, setTopics] = useState("");

  const subjects = useQuery({
    queryKey: ["subjects", user.id],
    queryFn: async () => (await supabase.from("subjects").select("id,name").eq("user_id", user.id)).data ?? [],
  });

  const exams = useQuery({
    queryKey: ["exams", user.id],
    queryFn: async () => (await supabase.from("exams").select("*, subjects(name,color)").eq("user_id", user.id).order("exam_date", { ascending: true })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").insert({
        user_id: user.id, title, exam_date: date, importance, subject_id: subjectId ?? null, topics: topics || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Exam added");
      setOpen(false); setTitle(""); setDate(""); setTopics(""); setImportance(3); setSubjectId(undefined);
      qc.invalidateQueries({ queryKey: ["exams"] });
      try { const r = await sync({ data: undefined as any }); celebrateAchievements(r.newly_earned); } catch { /* ignore */ }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("exams").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["exams"] }); },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Exams</h1>
          <p className="text-muted-foreground">Add your upcoming exams. The AI will prioritize them.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="size-4" /> Add exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New exam</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm — Algebra II" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Importance: {importance}</Label>
                  <input type="range" min={1} max={5} value={importance} onChange={(e) => setImportance(Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Choose a subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Topics / chapters</Label><Textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3} placeholder="Chapters, key concepts, etc." /></div>
              <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Adding..." : "Add exam"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {exams.data?.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No exams scheduled. Add one to power your AI plan.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {exams.data?.map((e) => {
            const days = differenceInCalendarDays(parseISO(e.exam_date), new Date());
            return (
              <Card key={e.id} className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{e.title}</h3>
                    {(() => {
                      const s = (e as unknown as { subjects?: { name: string; color: string } }).subjects;
                      return s ? <Badge variant="outline" style={{ borderColor: s.color, color: s.color }}>{s.name}</Badge> : null;
                    })()}
                    <Badge variant="secondary">Importance {e.importance}/5</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{format(parseISO(e.exam_date), "EEEE, MMMM d, yyyy")}</p>
                  {e.topics && <p className="text-sm mt-2 line-clamp-2">{e.topics}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={days < 0 ? "outline" : days <= 7 ? "destructive" : "default"}>
                    {days < 0 ? "Past" : `${days}d`}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(e.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
