import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Check, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand";
import { ProfileFields, type ProfileDraft } from "@/components/profile-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { contactEmail } from "@/lib/username";
import { useProfile } from "@/lib/db";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome — MedScribe AI" },
      { name: "description", content: "Set up your doctor profile." },
      { property: "og:title", content: "Welcome — MedScribe AI" },
      { property: "og:description", content: "Doctor onboarding for MedScribe AI." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Welcome", "Profile", "Privacy", "Done"];

function Onboarding() {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [ack, setAck] = useState([false, false, false]);
  const [draft, setDraft] = useState<ProfileDraft>({ full_name: "", specialty: "", clinic_name: "", phone: "", email: "", city: "", languages: ["English", "Hindi"] });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  useEffect(() => {
    if (profile) setDraft((d) => ({ ...d, full_name: profile.full_name || d.full_name, email: contactEmail(profile.email) || contactEmail(user?.email) }));
  }, [profile, user]);

  const finish = async () => {
    const { error } = await supabase.from("doctor_profiles").update({ ...draft, consent_acknowledged: true, onboarded: true }).eq("user_id", user!.id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    navigate({ to: "/dashboard" });
  };

  const acks = [
    "MedScribe AI is a documentation assistant only. It does not diagnose, recommend treatment, prescribe or triage.",
    "I remain responsible for all clinical decisions and will review every AI-generated note before it enters the medical record.",
    "I will obtain each patient's consent before recording a consultation for AI-assisted transcription.",
  ];

  return (
    <div className="min-h-screen bg-soft px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <div className="mt-8 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <div className="mt-6 rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
          {step === 0 && (
            <div>
              <Stethoscope className="h-10 w-10 text-primary" />
              <h1 className="mt-4 text-3xl font-bold">Welcome to MedScribe AI</h1>
              <p className="mt-3 text-muted-foreground">Let's set up your workspace in under a minute. You'll add your profile, preferred languages and confirm how the assistant should be used.</p>
              <Button className="mt-8" size="lg" onClick={() => setStep(1)}>Get started <ArrowRight /></Button>
            </div>
          )}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <h2 className="text-2xl font-bold">Your profile</h2>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">Shown on printed notes.</p>
              <ProfileFields value={draft} onChange={setDraft} />
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button disabled={!draft.languages.length}>Continue <ArrowRight /></Button>
              </div>
            </form>
          )}
          {step === 2 && (
            <div>
              <ShieldCheck className="h-9 w-9 text-primary" />
              <h2 className="mt-3 text-2xl font-bold">Privacy & responsible use</h2>
              <div className="mt-6 space-y-3">
                {acks.map((t, i) => (
                  <label key={i} className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/50">
                    <Checkbox checked={!!ack[i]} onCheckedChange={(c) => setAck(ack.map((a, j) => (j === i ? !!c : a)))} className="mt-0.5" />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Raw audio is processed temporarily and is not stored by default.</p>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={!ack.every(Boolean)} onClick={() => setStep(3)}>I agree <ArrowRight /></Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-7 w-7" /></div>
              <h2 className="mt-4 text-2xl font-bold">You're all set, {draft.full_name.split(" ").slice(0, 2).join(" ")}</h2>
              <p className="mt-2 text-muted-foreground">Head to your dashboard to add patients or try a demo consultation.</p>
              <Button className="mt-8" size="lg" onClick={finish}>Go to dashboard <ArrowRight /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
