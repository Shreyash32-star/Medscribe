import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const empty = { full_name: "", age: "", dob: "", gender: "", phone: "", external_id: "", blood_group: "", allergies: "", conditions: "", medications: "" };

export function AddPatientDialog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.age && !f.dob) { toast.error("Enter age or date of birth"); return; }
    setBusy(true);
    const { error } = await supabase.from("patients").insert({
      doctor_id: user!.id,
      full_name: f.full_name.trim(),
      age: f.age ? Number(f.age) : null,
      dob: f.dob || null,
      gender: f.gender || null,
      phone: f.phone || null,
      external_id: f.external_id || null,
      blood_group: f.blood_group || null,
      allergies: f.allergies || null,
      conditions: f.conditions || null,
      medications: f.medications || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Patient added");
    qc.invalidateQueries({ queryKey: ["patients"] });
    setF(empty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><UserPlus /> Add Patient</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Add patient</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Full name *</Label><Input required maxLength={120} value={f.full_name} onChange={set("full_name")} /></div>
          <div className="space-y-1.5"><Label>Age</Label><Input type="number" min={0} max={130} value={f.age} onChange={set("age")} /></div>
          <div className="space-y-1.5"><Label>or Date of birth</Label><Input type="date" value={f.dob} onChange={set("dob")} /></div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={f.gender} onValueChange={(v) => setF({ ...f, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Female", "Male", "Other", "Prefer not to say"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
          <div className="space-y-1.5"><Label>Patient ID (optional)</Label><Input value={f.external_id} onChange={set("external_id")} placeholder="ABHA / clinic ID" /></div>
          <div className="space-y-1.5">
            <Label>Blood group</Label>
            <Select value={f.blood_group} onValueChange={(v) => setF({ ...f, blood_group: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Allergies</Label><Textarea rows={2} value={f.allergies} onChange={set("allergies")} /></div>
          <div className="space-y-1.5"><Label>Existing conditions</Label><Textarea rows={2} value={f.conditions} onChange={set("conditions")} /></div>
          <div className="space-y-1.5"><Label>Current medications</Label><Textarea rows={2} value={f.medications} onChange={set("medications")} /></div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={busy}>Save patient</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
