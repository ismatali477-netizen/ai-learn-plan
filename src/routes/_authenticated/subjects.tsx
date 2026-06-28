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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({ meta: [{ title: "Subjects — AI Study Planner" }] }),
  component: SubjectsPage,
});

const COLORS = ["#2563EB", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function SubjectsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const sync = useServerFn(syncProgress);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState("");

  const subjects = useQuery({
    queryKey: ["subjects", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subjects").insert({ user_id: user.id, name, color, difficulty, notes: notes || null });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Subject added");
      setOpen(false); setName(""); setNotes(""); setDifficulty(3); setColor(COLORS[0]);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      try { const r = await sync({ data: undefined as any }); celebrateAchievements(r.newly_earned); } catch { /* ignore */ }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["subjects"] }); },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Subjects</h1>
          <p className="text-muted-foreground">Add the subjects you're studying. The AI uses these to build your plan.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="size-4" /> Add subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New subject</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calculus" /></div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`size-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Difficulty: {difficulty}</Label>
                <input type="range" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Topics, weak areas..." rows={3} /></div>
              <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Adding..." : "Add subject"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {subjects.data?.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No subjects yet. Add your first to get started.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.data?.map((s) => (
            <Card key={s.id} className="p-5 relative group">
              <div className="size-10 rounded-lg mb-3" style={{ background: s.color }} />
              <h3 className="font-semibold text-lg">{s.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">Difficulty {s.difficulty}/5</p>
              {s.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{s.notes}</p>}
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => del.mutate(s.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
