import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/brand";
import { AddPatientDialog } from "@/components/add-patient-dialog";
import { usePatients } from "@/lib/db";

export const Route = createFileRoute("/_app/patients/")({
  head: () => ({ meta: [{ title: "Patients — MedScribe AI" }, { name: "description", content: "Your patient list." }] }),
  component: Patients,
});

function Patients() {
  const { data: patients = [], isLoading } = usePatients();
  const [q, setQ] = useState("");
  const list = patients.filter((p) => `${p.full_name} ${p.phone ?? ""} ${p.external_id ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Patients" subtitle={`${patients.length} patients`} actions={<AddPatientDialog />} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 rounded-xl bg-card pl-9" placeholder="Search by name, phone or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No patients found.</p>
        ) : (
          list.map((p) => (
            <Link key={p.id} to="/patients/$patientId" params={{ patientId: p.id }} className="flex items-center gap-4 border-b px-6 py-4 last:border-0 hover:bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground">{p.full_name.replace(/^Demo — /, "").charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{[p.age && `${p.age} y`, p.gender, p.phone, p.external_id].filter(Boolean).join(" · ")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
