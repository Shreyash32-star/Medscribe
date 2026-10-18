import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, ClipboardList, FlaskConical, Mic, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/brand";
import { useAuth } from "@/lib/auth";
import { fmtDate, insertSamplePatients, isToday, useConsultations, usePatients, useProfile } from "@/lib/db";
import { useStartConsultation } from "@/lib/use-start-consultation";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MedScribe AI" }, { name: "description", content: "Today's consultations and pending notes." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: patients = [] } = usePatients();
  const { data: consultations = [] } = useConsultations();
  const { startDemo, busy } = useStartConsultation();

  const stats = [
    { label: "Today's consultations", value: consultations.filter((c) => isToday(c.created_at)).length, icon: CalendarCheck },
    { label: "Total patients", value: patients.length, icon: Users },
    { label: "Pending notes", value: consultations.filter((c) => c.status !== "finalized").length, icon: ClipboardList },
  ];

  const loadSamples = async () => {
    try {
      await insertSamplePatients(user!.id);
      await qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Sample patients added");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Good day, ${profile?.full_name?.split(" ").slice(0, 2).join(" ") || "Doctor"}`}
        subtitle={profile?.clinic_name || "Your documentation workspace"}
        actions={
          <>
            <Button variant="outline" onClick={startDemo} disabled={busy}><FlaskConical /> Demo Consultation</Button>
            <Button asChild><Link to="/consultation/new"><Mic /> Start Consultation</Link></Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className="rounded-lg bg-accent p-2 text-accent-foreground"><s.icon className="h-4 w-4" /></div>
            </div>
            <p className="mt-3 text-3xl font-bold text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed bg-card p-6">
          <div>
            <p className="font-semibold text-navy">No patients yet</p>
            <p className="text-sm text-muted-foreground">Add your first patient, or load three fictional sample patients to explore.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSamples}>Load sample patients</Button>
            <Button asChild><Link to="/patients">Add patient</Link></Button>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold">Recent consultations</h2>
          <Button variant="link" asChild><Link to="/history">View all</Link></Button>
        </div>
        {consultations.length === 0 ? (
          <p className="px-6 pb-8 pt-2 text-sm text-muted-foreground">No consultations yet. Try the demo consultation to see how it works.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead className="pl-6">Patient</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {consultations.slice(0, 6).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-medium text-navy">{c.patients?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button size="sm" variant="ghost" asChild><Link to="/consultation/$consultationId" params={{ consultationId: c.id }}>Open</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
