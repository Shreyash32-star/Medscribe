import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, FileText, FlaskConical, Loader2, Lock, Mic, MicOff, Pause, Play, Plus, Save, ShieldCheck, Sparkles, Square, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEMO_SEGMENTS } from "@/lib/demo";
import { AI_NOTE_FIELDS, fmtTime, type NoteFields, type Segment, type Speaker } from "@/lib/notes-schema";
import { structuringService } from "@/lib/services/structuring";
import { transcriptionService } from "@/lib/services/transcription";
import { useRecorder } from "@/lib/use-recorder";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/consultation/$consultationId")({
  validateSearch: (s: Record<string, unknown>): { demo?: boolean } => (s["demo"] === true || s["demo"] === "true" ? { demo: true } : {}),
  head: () => ({ meta: [{ title: "Consultation — MedScribe AI" }, { name: "description", content: "Record and document a consultation." }] }),
  component: ConsultationPage,
});

function useConsultationData(id: string) {
  return useQuery({
    queryKey: ["consultation", id],
    queryFn: async () => {
      const [c, s, n] = await Promise.all([
        supabase.from("consultations").select("*, patients(*)").eq("id", id).single(),
        supabase.from("transcript_segments").select("*").eq("consultation_id", id).order("idx"),
        supabase.from("clinical_notes").select("*").eq("consultation_id", id).maybeSingle(),
      ]);
      if (c.error) throw c.error;
      return { consultation: c.data, segments: s.data ?? [], note: n.data };
    },
  });
}

function ConsultationPage() {
  const { consultationId } = Route.useParams();
  const { data, isLoading, error } = useConsultationData(consultationId);
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (error || !data) return <p>Consultation not found. <Link to="/dashboard" className="text-primary">Back</Link></p>;
  return <Workspace key={consultationId} initial={data} />;
}

type Data = NonNullable<ReturnType<typeof useConsultationData>["data"]>;

function Workspace({ initial }: { initial: Data }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { demo } = Route.useSearch();
  const c = initial.consultation;
  const patient = c.patients;
  const finalized = c.status === "finalized";

  const [segments, setSegments] = useState<Segment[]>(
    initial.segments.map((s) => ({ id: s.id, speaker: s.speaker as Speaker, start_seconds: s.start_seconds, text: s.text })),
  );
  const [fields, setFields] = useState<NoteFields>((initial.note?.fields as NoteFields) ?? {});
  const [vitals, setVitals] = useState(initial.note?.vitals ?? "");
  const [assessment, setAssessment] = useState(initial.note?.doctor_assessment ?? "");
  const [plan, setPlan] = useState(initial.note?.doctor_plan ?? "");
  const [aiGenerated, setAiGenerated] = useState(initial.note?.ai_generated ?? false);
  const [consent, setConsent] = useState(c.consent_confirmed);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(0);
  const [isDemo, setIsDemo] = useState(c.is_demo);
  const demoLoaded = useRef(false);

  const rec = useRecorder(async (blob, elapsed) => {
    setTranscribing((n) => n + 1);
    try {
      const segs = await transcriptionService.transcribeChunk(blob, elapsed);
      setSegments((prev) => [...prev, ...segs]);
    } finally {
      setTranscribing((n) => n - 1);
    }
  });

  const loadDemo = () => {
    setSegments(DEMO_SEGMENTS.map((s) => ({ ...s })));
    setIsDemo(true);
    toast.info("Demo transcript loaded", { description: "Sample fictional consultation. Click Generate Notes." });
  };

  useEffect(() => {
    if (demo && !demoLoaded.current && segments.length === 0 && !finalized) { demoLoaded.current = true; loadDemo(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  const requestStart = () => {
    if (!consent) { setConsentOpen(true); return; }
    transcriptionService.reset();
    rec.start();
  };

  const confirmConsent = async () => {
    await supabase.from("consultations").update({ consent_confirmed: true }).eq("id", c.id);
    setConsent(true);
    setConsentOpen(false);
    transcriptionService.reset();
    rec.start();
  };

  const generate = async () => {
    if (!segments.length) { toast.error("No transcript yet — record or load the demo first."); return; }
    setGenerating(true);
    const out = await structuringService.structure(segments);
    setFields(out);
    setAiGenerated(true);
    setGenerating(false);
    toast.success("Draft documentation generated", { description: "Review and edit every field before finalizing." });
  };

  const persist = async (status?: "finalized") => {
    const doctorId = user!.id;
    const del = await supabase.from("transcript_segments").delete().eq("consultation_id", c.id);
    if (del.error) throw del.error;
    if (segments.length) {
      const ins = await supabase.from("transcript_segments").insert(
        segments.map((s, idx) => ({ doctor_id: doctorId, consultation_id: c.id, idx, speaker: s.speaker, start_seconds: s.start_seconds, text: s.text })),
      );
      if (ins.error) throw ins.error;
    }
    const note = await supabase.from("clinical_notes").upsert(
      { doctor_id: doctorId, consultation_id: c.id, fields, vitals, doctor_assessment: assessment, doctor_plan: plan, ai_generated: aiGenerated, reviewed: status === "finalized" },
      { onConflict: "consultation_id" },
    );
    if (note.error) throw note.error;
    const upd = await supabase.from("consultations").update({
      duration_seconds: Math.max(c.duration_seconds, rec.elapsed, segments.at(-1)?.start_seconds ?? 0),
      is_demo: isDemo,
      ...(status ? { status, finalized_at: new Date().toISOString() } : {}),
    }).eq("id", c.id);
    if (upd.error) throw upd.error;
    qc.invalidateQueries({ queryKey: ["consultations"] });
    qc.invalidateQueries({ queryKey: ["consultation", c.id] });
  };

  const saveDraft = async () => {
    setSaving(true);
    try { await persist(); toast.success("Draft saved"); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const finalize = async () => {
    setSaving(true);
    try {
      if (rec.status === "recording" || rec.status === "paused") rec.stop();
      await persist("finalized");
      rec.discardAudio();
      toast.success("Consultation finalized");
      navigate({ to: "/notes/$consultationId", params: { consultationId: c.id } });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); setFinalizeOpen(false); }
  };

  const deleteTranscript = async () => {
    if (rec.status === "recording" || rec.status === "paused") rec.stop();
    rec.discardAudio();
    setSegments([]);
    await supabase.from("transcript_segments").delete().eq("consultation_id", c.id);
    toast.success("Transcript and temporary recording deleted");
  };

  const updateSeg = (i: number, patch: Partial<Segment>) => setSegments((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const active = rec.status === "recording" || rec.status === "paused";

  return (
    <div className="-mt-2">
      {/* Patient bar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{patient?.full_name}</h1>
              <StatusBadge status={c.status} />
              {isDemo && <Badge variant="outline" className="gap-1"><FlaskConical className="h-3 w-3" /> Demo</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {[patient?.age && `${patient.age} y`, patient?.gender, patient?.blood_group && `Blood ${patient.blood_group}`, patient?.allergies && `Allergies: ${patient.allergies}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={generate} disabled={generating || finalized}>{generating ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate Notes</Button>
          <Button variant="outline" onClick={saveDraft} disabled={saving || finalized}><Save /> Save Draft</Button>
          {finalized ? (
            <Button asChild><Link to="/notes/$consultationId" params={{ consultationId: c.id }}><FileText /> View note</Link></Button>
          ) : (
            <Button onClick={() => { setReviewChecked(false); setFinalizeOpen(true); }} disabled={saving}><CheckCircle2 /> Finalize Consultation</Button>
          )}
        </div>
      </div>

      {finalized && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> This consultation is finalized and read-only.</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* LEFT: mic + transcript */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-soft p-8 text-center shadow-[var(--shadow-card)]">
            <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
              {rec.status === "recording" && (
                <>
                  <span className="absolute inset-4 rounded-full bg-primary/30 animate-mic-pulse" />
                  <span className="absolute inset-4 rounded-full bg-primary/20 animate-mic-pulse [animation-delay:0.9s]" />
                </>
              )}
              <button
                onClick={active ? (rec.status === "recording" ? rec.pause : rec.resume) : requestStart}
                disabled={finalized || rec.status === "requesting"}
                aria-label={active ? (rec.status === "recording" ? "Pause recording" : "Resume recording") : "Start microphone"}
                className={cn(
                  "relative z-10 flex h-36 w-36 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-50",
                  rec.status === "paused" ? "bg-navy" : "bg-mic",
                  "shadow-[var(--shadow-mic)]",
                )}
                style={rec.status === "recording" ? { transform: `scale(${1 + rec.level * 0.08})` } : undefined}
              >
                {rec.status === "requesting" ? <Loader2 className="h-12 w-12 animate-spin" /> : rec.status === "recording" ? <Pause className="h-12 w-12" /> : rec.status === "paused" ? <Play className="h-12 w-12" /> : <Mic className="h-14 w-14" />}
              </button>
            </div>
            <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-navy">{fmtTime(rec.elapsed)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {{
                idle: "Tap to start recording",
                requesting: "Waiting for microphone permission…",
                recording: "Listening — tap to pause",
                paused: "Paused — tap to resume",
                stopped: "Recording stopped. Audio is held temporarily in this tab only.",
                denied: "Microphone access was blocked. Allow it in your browser settings and try again.",
                unsupported: "This browser does not support in-browser recording.",
              }[rec.status]}
            </p>
            {active && (
              <div className="mt-4 flex h-8 items-end justify-center gap-1" aria-hidden>
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="w-1 rounded-full bg-primary/70 transition-all" style={{ height: rec.status === "recording" ? `${8 + Math.abs(Math.sin(i * 1.3 + rec.elapsed)) * rec.level * 28}px` : "4px" }} />
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {active && <Button variant="outline" onClick={rec.stop}><Square /> Stop</Button>}
              {(rec.status === "denied" || rec.status === "stopped") && <Button variant="outline" onClick={requestStart}><Mic /> Record again</Button>}
              {!finalized && <Button variant="ghost" onClick={loadDemo} disabled={active}><FlaskConical /> Load demo dialogue</Button>}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">Transcription engine: {transcriptionService.name}</p>
          </div>

          <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 font-semibold">Live Transcript {transcribing > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</h2>
                <p className="text-xs text-muted-foreground">Speaker labels are a demo convenience, not reliable speaker identification. Edit as needed.</p>
              </div>
              <div className="flex gap-1">
                {!finalized && <Button size="sm" variant="ghost" onClick={() => setSegments((s) => [...s, { speaker: "Doctor", start_seconds: rec.elapsed, text: "" }])}><Plus /> Line</Button>}
                {!finalized && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 /> Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete transcript & recording?</AlertDialogTitle><AlertDialogDescription>This removes all transcript lines for this consultation and discards the temporary audio. Structured notes are kept.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteTranscript}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <div className="max-h-[480px] space-y-1 overflow-y-auto p-3">
              {segments.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Transcript will appear here as you speak.</p> : segments.map((s, i) => (
                <div key={i} className="group flex gap-3 rounded-xl px-2 py-2 hover:bg-muted/50">
                  <span className="mt-2 w-11 shrink-0 font-mono text-xs text-muted-foreground">{fmtTime(s.start_seconds)}</span>
                  <button
                    disabled={finalized}
                    onClick={() => updateSeg(i, { speaker: s.speaker === "Doctor" ? "Patient" : s.speaker === "Patient" ? "Unknown" : "Doctor" })}
                    className={cn("mt-1 h-6 shrink-0 rounded-md px-2 text-[11px] font-semibold", s.speaker === "Doctor" ? "bg-accent text-accent-foreground" : s.speaker === "Patient" ? "bg-secondary text-navy" : "bg-muted text-muted-foreground")}
                    title="Click to change speaker"
                  >{s.speaker}</button>
                  <Textarea
                    value={s.text}
                    readOnly={finalized}
                    onChange={(e) => updateSeg(i, { text: e.target.value })}
                    rows={1}
                    className="min-h-0 resize-none border-transparent bg-transparent px-2 py-1 shadow-none focus-visible:border-input focus-visible:bg-card"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: structured notes */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Structured documentation</h2>
              {aiGenerated && (
                <p className="mt-2 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" /> AI-generated documentation — review before use.
                </p>
              )}
            </div>
            <div className="space-y-4 p-5">
              {AI_NOTE_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                  <Textarea rows={2} readOnly={finalized} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} placeholder="Not mentioned" />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examination / vitals <Badge variant="outline" className="text-[10px] normal-case">Manual entry only</Badge></Label>
                <Textarea rows={2} readOnly={finalized} value={vitals} onChange={(e) => setVitals(e.target.value)} placeholder="BP, pulse, temp, SpO₂, examination findings…" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-navy/15 bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy"><ShieldCheck className="h-4 w-4" /> Doctor-only sections — never filled by AI</div>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Doctor Assessment</Label><Textarea rows={3} readOnly={finalized} value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Your clinical assessment" /></div>
              <div className="space-y-1.5"><Label>Doctor Plan</Label><Textarea rows={3} readOnly={finalized} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Your management plan" /></div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient consent required</DialogTitle>
            <DialogDescription>Before recording, confirm the patient has agreed to AI-assisted transcription and documentation of this consultation.</DialogDescription>
          </DialogHeader>
          <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm">
            <Checkbox checked={consentChecked} onCheckedChange={(v) => setConsentChecked(!!v)} className="mt-0.5" />
            <span>{patient?.full_name} has given verbal or written consent to record this consultation for AI-assisted transcription and documentation. Audio is temporary and not stored.</span>
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConsentOpen(false)}>Cancel</Button>
            <Button disabled={!consentChecked} onClick={confirmConsent}><Mic /> Confirm & start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize consultation?</DialogTitle>
            <DialogDescription>Finalized notes become part of the medical record and can no longer be edited.</DialogDescription>
          </DialogHeader>
          <label className="flex cursor-pointer gap-3 rounded-xl border p-4 text-sm">
            <Checkbox checked={reviewChecked} onCheckedChange={(v) => setReviewChecked(!!v)} className="mt-0.5" />
            <span>I have reviewed and corrected all AI-generated documentation. I take responsibility for this note and all clinical decisions.</span>
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFinalizeOpen(false)}>Keep editing</Button>
            <Button disabled={!reviewChecked || saving} onClick={finalize}>{saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Finalize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {rec.status === "denied" && <span className="sr-only"><MicOff /></span>}
    </div>
  );
}
