import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, LayoutDashboard, BookOpen, CalendarDays, Wand2, LogOut,
  BarChart3, Timer, Trophy, Bell, UserCircle, FileText, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: Wand2 },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/exams", label: "Exams", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

const SECONDARY_NAV = [
  { to: "/sessions", label: "Sessions", icon: Timer },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/profile", label: "Settings", icon: UserCircle },
] as const;

function AppShell() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unread = useQuery({
    queryKey: ["notifications-unread", user.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .is("read_at", null);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen flex bg-muted/30 text-foreground">
      <aside className="hidden md:flex w-60 flex-col border-r bg-background sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold">StudyPlanner</span>
        </Link>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary" }}
            >
              <n.icon className="size-4" /> {n.label}
              {n.to === "/notifications" && unread.data ? (
                <span className="ml-auto rounded-full bg-primary text-primary-foreground text-xs px-1.5 min-w-5 h-5 grid place-items-center">{unread.data}</span>
              ) : null}
            </Link>
          ))}
          <div className="my-2 border-t" />
          {SECONDARY_NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t shrink-0">
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b bg-background px-4 h-14 sticky top-0 z-30">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> StudyPlanner
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/notifications" aria-label="Notifications" className="relative p-2">
              <Bell className="size-5" />
              {unread.data ? <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" /> : null}
            </Link>
            <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </header>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-20 bg-background overflow-y-auto">
            <nav className="p-3 space-y-1">
              {[...NAV, ...SECONDARY_NAV].map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors" activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium bg-primary/10 text-primary" }}>
                  <n.icon className="size-5" /> {n.label}
                </Link>
              ))}
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-destructive">
                <LogOut className="size-5" /> Sign out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
