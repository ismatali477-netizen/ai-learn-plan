import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LayoutDashboard, BookOpen, CalendarDays, Wand2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/subjects", label: "Subjects", icon: BookOpen },
    { to: "/exams", label: "Exams", icon: CalendarDays },
    { to: "/planner", label: "AI Planner", icon: Wand2 },
  ] as const;

  return (
    <div className="min-h-screen flex bg-muted/30 text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 h-16 border-b">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold">StudyPlanner</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
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
        <div className="p-3 border-t">
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b bg-background px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> StudyPlanner
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <nav className="md:hidden grid grid-cols-4 border-t bg-background">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
              activeProps={{ className: "flex flex-col items-center gap-1 py-2 text-xs text-primary" }}>
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
