import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { markNotificationsRead } from "@/lib/gamification.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — AI Study Planner" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const markRead = useServerFn(markNotificationsRead);

  const list = useQuery({
    queryKey: ["notifications-list", user.id],
    queryFn: async () => (await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)).data ?? [],
  });

  const markAll = useMutation({
    mutationFn: () => markRead({ data: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2"><Bell className="size-7 text-primary" /> Notifications</h1>
          <p className="text-muted-foreground">Reminders, achievements, and alerts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="gap-2">
          <Check className="size-4" /> Mark all read
        </Button>
      </header>

      {(list.data ?? []).length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">You're all caught up.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {list.data!.map((n) => (
            <li key={n.id}>
              <Card className={`p-4 ${n.read_at ? "" : "border-primary/40 bg-primary/5"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{format(parseISO(n.created_at), "MMM d, p")}</p>
                  </div>
                  {!n.read_at && <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
