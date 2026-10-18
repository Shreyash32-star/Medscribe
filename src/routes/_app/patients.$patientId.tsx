import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/brand";
import { fmtDate, useConsultations, usePatients } from "@/lib/db";
import { useStartConsultation } from "@/lib/use-start-consultation";

export const Route = createFileRoute("/_app/patients/$patientId")({
  head: () => ({ meta: [{ title: "Patient profile — MedScribe AI" }, { name: "description", content: "Patient details and consultation timeline." }] }),
  component: PatientProfile,
});

function PatientProfile() {
  const { patientId } = Route.useParams();
  const { data: patients = [], isLoading } = usePatients();
  const { data: consultations = [] } = useConsultations(patientId);
  const { start, busy } = useStartConsultation();
  const p = patients.find((x) => x.id === patientId);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!p) return <p>Patient not found. <Link to="/patients" className="text-primary">Back</Link></p>;

  const info = [
    ["Age / DOB", [p.age && `${p.age} years`, p.dob].filter(Boolean).join(" · ") || "—"],
    ["Gender", p.gender || "—"], ["Phone", p.phone || "—"], ["Patient ID", p.external_id || "—"], ["Blood group", p.blood_group || "—"],
  ];
  const clinical = [["Allergies", p.allergies], ["Existing conditions", p.conditions], ["Current medications", p.medications]];

  return (
    <div>
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Patients</Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-foreground">{p.full_name.replace(/^Demo — /, "").charAt(0)}</div>
          <div><h1 className="text-2xl font-bold">{p.full_name}</h1><p className="text-sm text-muted-foreground">Added {fmtDate(p.created_at)}</p></div>
        </div>
        <Button size="lg" onClick={() => start(p.id)} disabled={busy}><Mic /> Start New Consultation</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-4 font-semibold">Details</h3>
            <dl className="space-y-3 text-sm">{info.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-navy">{v}</dd></div>)}</dl>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-4 font-semibold">Clinical background</h3>
            <dl className="space-y-4 text-sm">{clinical.map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="mt-1 text-navy">{v || "—"}</dd></div>)}</dl>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-6 font-semibold">Consultation timeline</h3>
          {consultations.length === 0 ? <p className="text-sm text-muted-foreground">No consultations yet.</p> : (
            <ol className="relative space-y-6 border-l pl-6">
              {consultations.map((c) => (
                <li key={c.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy">{fmtDate(c.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(c.duration_seconds / 60)} min{c.is_demo ? " · demo" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <Button size="sm" variant="ghost" asChild><Link to="/consultation/$consultationId" params={{ consultationId: c.id }}>Open</Link></Button>
                      <Button size="sm" variant="ghost" asChild><Link to="/notes/$consultationId" params={{ consultationId: c.id }}><FileText /></Link></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
