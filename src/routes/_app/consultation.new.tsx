import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Mic, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/brand";
import { AddPatientDialog } from "@/components/add-patient-dialog";
import { usePatients } from "@/lib/db";
import { useStartConsultation } from "@/lib/use-start-consultation";

export const Route = createFileRoute("/_app/consultation/new")({
  head: () => ({ meta: [{ title: "New consultation — MedScribe AI" }, { name: "description", content: "Choose a patient to start documenting." }] }),
  component: NewConsultation,
});

function NewConsultation() {
  const { data: patients = [] } = usePatients();
  const { start, startDemo, busy } = useStartConsultation();
  const [q, setQ] = useState("");
  const list = patients.filter((p) => p.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="New consultation" subtitle="Select the patient you are seeing." actions={<><Button variant="outline" onClick={startDemo} disabled={busy}><FlaskConical /> Demo Consultation</Button><AddPatientDialog /></>} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 rounded-xl bg-card pl-9" placeholder="Search patients" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="min-w-0"><p className="truncate font-medium text-navy">{p.full_name}</p><p className="text-xs text-muted-foreground">{[p.age && `${p.age} y`, p.gender].filter(Boolean).join(" · ")}</p></div>
            <Button size="sm" onClick={() => start(p.id)} disabled={busy}><Mic /> Start</Button>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No patients. Add one to begin.</p>}
      </div>
    </div>
  );
}
