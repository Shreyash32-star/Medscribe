import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, useProfile } from "@/lib/db";
import { AI_NOTE_FIELDS, fmtTime, type NoteFields } from "@/lib/notes-schema";

export const Route = createFileRoute("/_app/notes/$consultationId")({
  head: () => ({ meta: [{ title: "Clinical note — MedScribe AI" }, { name: "description", content: "Print-friendly consultation note." }] }),
  component: NoteView,
});

function NoteView() {
  const { consultationId } = Route.useParams();
  const { data: profile } = useProfile();
  const { data, isLoading } = useQuery({
    queryKey: ["note-view", consultationId],
    queryFn: async () => {
      const [c, n, s] = await Promise.all([
        supabase.from("consultations").select("*, patients(*)").eq("id", consultationId).single(),
        supabase.from("clinical_notes").select("*").eq("consultation_id", consultationId).maybeSingle(),
        supabase.from("transcript_segments").select("*").eq("consultation_id", consultationId).order("idx"),
      ]);
      if (c.error) throw c.error;
      return { c: c.data, n: n.data, s: s.data ?? [] };
    },
  });
  if (isLoading || !data) return <Loader2 className="mx-auto mt-20 animate-spin text-primary" />;
  const { c, n, s } = data;
  const p = c.patients;
  const fields = (n?.fields as NoteFields) ?? {};
  const Section = ({ label, value }: { label: string; value?: string | null | undefined }) =>
    value ? <div className="break-inside-avoid"><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-navy">{value}</p></div> : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex justify-between">
        <Button variant="ghost" asChild><Link to="/history"><ArrowLeft /> History</Link></Button>
        <Button onClick={() => window.print()}><Printer /> Print</Button>
      </div>
      <article className="rounded-2xl border bg-card p-10 shadow-[var(--shadow-card)] print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-lg font-bold text-navy">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{[profile?.specialty, profile?.clinic_name, profile?.city].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right text-sm"><StatusBadge status={c.status} /><p className="mt-2 text-muted-foreground">{fmtDate(c.created_at)}</p></div>
        </header>
        <section className="grid grid-cols-2 gap-4 border-b py-6 text-sm sm:grid-cols-4">
          {[["Patient", p?.full_name], ["Age / Sex", [p?.age, p?.gender].filter(Boolean).join(" / ")], ["Patient ID", p?.external_id || "—"], ["Allergies", p?.allergies || "—"]].map(([k, v]) => (
            <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium text-navy">{v}</p></div>
          ))}
        </section>
        {n?.ai_generated && <p className="mt-6 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-foreground">Documentation drafted with AI assistance from the consultation transcript{n.reviewed ? " and reviewed by the doctor." : " — not yet reviewed."}</p>}
        <div className="mt-6 space-y-5">
          {AI_NOTE_FIELDS.map((f) => <Section key={f.key} label={f.label} value={fields[f.key]} />)}
          <Section label="Examination / vitals" value={n?.vitals} />
          <Section label="Doctor Assessment" value={n?.doctor_assessment} />
          <Section label="Doctor Plan" value={n?.doctor_plan} />
          {!n && <p className="text-sm text-muted-foreground">No notes saved yet.</p>}
        </div>
        {s.length > 0 && (
          <details className="mt-8 border-t pt-6 print:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-navy">Source transcript ({s.length} lines)</summary>
            <div className="mt-3 space-y-1 text-sm">{s.map((x) => <p key={x.id}><span className="font-mono text-xs text-muted-foreground">{fmtTime(x.start_seconds)}</span> <b>{x.speaker}:</b> {x.text}</p>)}</div>
          </details>
        )}
        <footer className="mt-10 border-t pt-4 text-xs text-muted-foreground">
          {c.finalized_at ? `Finalized ${fmtDate(c.finalized_at)} by ${profile?.full_name}.` : "Draft — not part of the medical record."} MedScribe AI is a documentation tool; all clinical decisions are the doctor's.
        </footer>
      </article>
    </div>
  );
}
