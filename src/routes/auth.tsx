import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { normalizeUsername, signInIdentity, usernameIdentity } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({ meta: [{ title: "Sign in — MedScribe AI" }, { name: "description", content: "Sign in to your doctor workspace with your username and password." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);
  useEffect(() => { setIsSignup(mode === "signup"); }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (isSignup) {
        const normalized = normalizeUsername(username);
        // Refuse before creating an unusable account or sending mail to an internal ID.
        const response = await fetch(`${import.meta.env['VITE_SUPABASE_URL']}/auth/v1/settings`, {
          headers: { apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] },
        });
        if (!response.ok) throw new Error("Unable to check registration settings. Please try again.");
        const settings = await response.json();
        if (settings.mailer_autoconfirm !== true) {
          throw new Error("Username registration is not enabled yet. Please contact the administrator.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: usernameIdentity(normalized), password,
          options: { data: { username: normalized } },
        });
        if (error) throw error;
        if (!data.session) throw new Error("Unable to create this account. Please contact the administrator.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: signInIdentity(username), password });
        if (error) throw new Error("Unable to sign in. Check your username and password and try again.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
        <Logo />
        <h2 className="mt-8 text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back, Doctor"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{isSignup ? "Choose a username and password to get started." : "Sign in to continue."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required autoComplete="username" autoCapitalize="none" spellCheck={false}
              minLength={isSignup ? 3 : undefined} maxLength={isSignup ? 32 : 254}
              pattern={isSignup ? "[a-zA-Z0-9][a-zA-Z0-9_]{2,31}" : undefined}
              value={username} onChange={(e) => setUsername(e.target.value)} placeholder="dr_priya" disabled={busy} />
            {isSignup && <p className="text-xs text-muted-foreground">3–32 letters, numbers or underscores.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={isSignup ? 12 : 1}
              autoComplete={isSignup ? "new-password" : "current-password"} value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={busy} />
            {isSignup && <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>}
          </div>
          <Button className="w-full" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already registered?" : "New to MedScribe AI?"}{" "}
          <button type="button" disabled={busy} className="font-medium text-primary hover:underline"
            onClick={() => { setPassword(""); navigate({ to: "/auth", search: isSignup ? {} : { mode: "signup" } }); }}>
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}
