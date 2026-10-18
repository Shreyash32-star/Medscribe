import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { History, LayoutDashboard, Loader2, LogOut, Mic, Settings, Users } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/db";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/consultation/new", label: "New Consultation", icon: Mic },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    else if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [user, loading, profile, navigate]);

  if (loading || !user || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-5 lg:flex">
        <Logo className="px-2" />
        <nav className="mt-10 flex-1 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <n.icon className="h-4.5 w-4.5" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-xl border bg-card p-3">
          <p className="truncate text-sm font-semibold text-navy">{profile?.full_name || "Doctor"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.specialty || user.user_metadata["username"] || "Doctor"}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={() => supabase.auth.signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()}><LogOut /></Button>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-24 md:px-8 md:py-10 lg:pb-10">
          <Outlet />
        </main>
        <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex justify-around border-t bg-card py-2 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 px-2 text-[10px] text-muted-foreground" activeProps={{ className: "!text-primary" }}>
              <n.icon className="h-5 w-5" /> {n.label.replace("New ", "")}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
