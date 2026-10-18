import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/brand";
import { fmtDate, useConsultations } from "@/lib/db";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — MedScribe AI" }, { name: "description", content: "All previous consultations." }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data = [] } = useConsultations();
  const [tab, setTab] = useState("all");
  const list = data.filter((c) => tab === "all" || c.status === tab);
  return (
    <div>
      <PageHeader title="History" subtitle="Previous consultations and notes" />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="draft">Draft</TabsTrigger><TabsTrigger value="finalized">Finalized</TabsTrigger></TabsList>
      </Tabs>
      <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        {list.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Nothing here yet.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead className="pl-6">Patient</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-medium text-navy">{c.patients?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{Math.max(1, Math.round(c.duration_seconds / 60))} min</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="pr-6 text-right">
                    {c.status !== "finalized" && <Button size="sm" variant="ghost" asChild><Link to="/consultation/$consultationId" params={{ consultationId: c.id }}><Pencil /> Edit</Link></Button>}
                    <Button size="sm" variant="ghost" asChild><Link to="/notes/$consultationId" params={{ consultationId: c.id }}><FileText /> View note</Link></Button>
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
