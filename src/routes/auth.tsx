import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — MedScribe AI" },
      { name: "description", content: "Sign in or create your MedScribe AI doctor account." },
      { property: "og:title", content: "Sign in — MedScribe AI" },
      { property: "og:description", content: "Access your clinical documentation workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
        <Logo />
        {sent ? (
          <div className="mt-8 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to {email}. Confirm it, then sign in.</p>
            <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setIsSignup(false); }}>Back to sign in</Button>
          </div>
        ) : (
          <>
            <h2 className="mt-8 text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back, Doctor"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{isSignup ? "Set up your documentation workspace." : "Sign in to continue."}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {isSignup && (
                <div className="space-y-1.5"><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Priya Sharma" /></div>
              )}
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" size="lg" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} {isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignup ? "Already registered?" : "New to MedScribe AI?"}{" "}
              <button className="font-medium text-primary hover:underline" onClick={() => setIsSignup(!isSignup)}>
                {isSignup ? "Sign in" : "Create an account"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
