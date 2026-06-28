import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { Trophy, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — AI Study Planner" }] }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { user } = Route.useRouteContext();

  const catalog = useQuery({
    queryKey: ["achievements-catalog"],
    queryFn: async () => (await supabase.from("achievements").select("*").order("threshold_value")).data ?? [],
  });

  const mine = useQuery({
    queryKey: ["my-achievements", user.id],
    queryFn: async () => (await supabase.from("user_achievements").select("achievement_id,earned_at").eq("user_id", user.id)).data ?? [],
  });

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("xp,level,streak_days").eq("id", user.id).maybeSingle()).data,
  });

  const earnedMap = new Map((mine.data ?? []).map((m) => [m.achievement_id, m.earned_at]));
  const earnedCount = mine.data?.length ?? 0;
  const totalCount = catalog.data?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><Trophy className="size-7 text-primary" /> Achievements</h1>
        <p className="text-muted-foreground">Unlock badges as you build the study habit.</p>
      </header>

      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-semibold">{profile.data?.level ?? 1}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Level</div>
          </div>
          <div>
            <div className="text-3xl font-semibold">{profile.data?.xp ?? 0}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">XP</div>
          </div>
          <div>
            <div className="text-3xl font-semibold">{earnedCount}/{totalCount}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Badges</div>
          </div>
        </div>
      </Card>

      {catalog.isLoading ? (
        <Card className="p-10 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.data!.map((a) => {
            const earned = earnedMap.has(a.id);
            const Icon = ((LucideIcons as any)[a.icon] as React.ComponentType<{ className?: string }>) ?? Trophy;
            return (
              <Card key={a.id} className={`p-5 relative overflow-hidden ${earned ? "" : "opacity-60"}`}>
                <div className={`size-12 rounded-xl grid place-items-center mb-3 ${earned ? "bg-gradient-to-br from-primary to-secondary text-white" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-6" />
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline">+{a.xp_reward} XP</Badge>
                  {earned ? <span className="text-xs text-muted-foreground">Earned {format(parseISO(earnedMap.get(a.id)!), "MMM d")}</span> : <span className="text-xs text-muted-foreground">Locked</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
