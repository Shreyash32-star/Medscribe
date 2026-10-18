import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/brand";
import { ProfileFields, type ProfileDraft } from "@/components/profile-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { contactEmail } from "@/lib/username";
import { useProfile } from "@/lib/db";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — MedScribe AI" }, { name: "description", content: "Profile, clinic and privacy settings." }] }),
  component: SettingsPage,
});

const Card = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
    <h2 className="text-lg font-semibold">{title}</h2>
    {desc && <p className="mb-5 mt-1 text-sm text-muted-foreground">{desc}</p>}
    {children}
  </section>
);

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [address, setAddress] = useState("");
  const [template, setTemplate] = useState("SOAP-style documentation");

  useEffect(() => {
    if (profile && !draft) {
      setDraft({ full_name: profile.full_name, specialty: profile.specialty ?? "", clinic_name: profile.clinic_name ?? "", phone: profile.phone ?? "", email: contactEmail(profile.email), city: profile.city ?? "", languages: profile.languages });
      setAddress(profile.clinic_address ?? "");
      setTemplate(profile.note_template);
    }
  }, [profile, draft]);

  const save = async () => {
    const { error } = await supabase.from("doctor_profiles").update({ ...draft!, clinic_address: address, note_template: template }).eq("user_id", user!.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  };

  const deleteAllTranscripts = async () => {
    const { error } = await supabase.from("transcript_segments").delete().eq("doctor_id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("All transcripts deleted");
  };

  if (!draft) return null;
  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" actions={<Button onClick={save}>Save changes</Button>} />
      <div className="space-y-6">
        <Card title="Doctor profile & languages" desc="Shown on printed notes."><ProfileFields value={draft} onChange={setDraft} /></Card>
        <Card title="Clinic details">
          <div className="space-y-1.5"><Label>Clinic address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city, PIN" /></div>
        </Card>
        <Card title="Documentation template" desc="Controls how notes are organised.">
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["SOAP-style documentation", "General OPD note", "Follow-up visit note", "Paediatric OPD note"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Card>
        <Card title="Microphone test" desc="Check that your browser can hear you."><MicTest /></Card>
        <Card title="Privacy & data controls">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div><p className="font-medium text-navy">Retain raw audio recordings</p><p className="text-sm text-muted-foreground">Off by default. Audio stays in the browser tab only and is discarded afterwards.</p></div>
              <Switch checked={false} disabled />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="font-medium text-navy">Data export</p><p className="text-sm text-muted-foreground">Coming soon.</p></div>
              <Button variant="outline" disabled>Export</Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="font-medium text-navy">Delete all transcripts</p><p className="text-sm text-muted-foreground">Removes every transcript line. Notes remain.</p></div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive"><Trash2 /> Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete all transcripts?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteAllTranscripts}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MicTest() {
  const [level, setLevel] = useState(0);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);

  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      let raf = 0;
      const tick = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += ((v - 128) / 128) ** 2; setLevel(Math.min(100, Math.sqrt(s / buf.length) * 400)); raf = requestAnimationFrame(tick); };
      tick();
      stopRef.current = () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); ctx.close().catch(() => {}); setOn(false); setLevel(0); };
      setOn(true);
    } catch {
      setErr("Microphone permission denied or unavailable.");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-4">
      {on ? <Button variant="outline" onClick={() => stopRef.current()}><Square /> Stop test</Button> : <Button variant="outline" onClick={start}><Mic /> Test microphone</Button>}
      <Progress value={level} className="h-2 max-w-xs flex-1" />
      {err && <p className="w-full text-sm text-destructive">{err}</p>}
    </div>
  );
}
