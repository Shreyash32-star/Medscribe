import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, Languages, FileText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedScribe AI — Ambient clinical documentation for Indian clinics" },
      { name: "description", content: "Turn consultations in English, Hindi, Marathi and Hinglish into editable clinical notes. Documentation only — the doctor decides." },
      { property: "og:title", content: "MedScribe AI — Ambient clinical documentation" },
      { property: "og:description", content: "AI-assisted documentation for Indian clinics. Doctors stay in charge of every clinical decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const features = [
    { icon: Mic, title: "Ambient capture", text: "Record the consultation in your browser. Audio stays temporary." },
    { icon: Languages, title: "Built for Indian clinics", text: "English, Hindi, Marathi and Hinglish conversations." },
    { icon: FileText, title: "Structured, editable notes", text: "Only what was said, organised into documentation fields." },
    { icon: ShieldCheck, title: "Doctor in control", text: "No diagnosis, no prescriptions. You review and finalise." },
  ];

  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Documentation assistant — not a diagnostic tool
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Listen to your patient.<br /><span className="text-primary">We'll handle the notes.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            MedScribe AI turns multilingual consultations into clean, editable clinical documentation — so you can spend less time typing and more time with patients.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Create doctor account</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/auth">I already have an account</Link></Button>
          </div>
        </div>
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
