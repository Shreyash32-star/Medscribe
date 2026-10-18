/** Documentation fields the AI structuring service MAY populate (only from transcript text). */
export const AI_NOTE_FIELDS = [
  { key: "chief_complaint", label: "Chief complaint" },
  { key: "duration_onset", label: "Duration / onset" },
  { key: "hpi", label: "History of present illness" },
  { key: "associated_symptoms", label: "Associated symptoms" },
  { key: "negative_symptoms", label: "Negative symptoms (explicitly mentioned)" },
  { key: "past_history", label: "Past medical history" },
  { key: "current_medications", label: "Current medications mentioned" },
  { key: "allergies", label: "Allergies" },
  { key: "family_history", label: "Family history" },
  { key: "social_history", label: "Social history" },
  { key: "investigations", label: "Investigations / reports mentioned" },
  { key: "follow_up", label: "Follow-up instructions (stated by doctor)" },
] as const;

export type NoteFieldKey = (typeof AI_NOTE_FIELDS)[number]["key"];
export type NoteFields = Partial<Record<NoteFieldKey, string>>;

export type Speaker = "Doctor" | "Patient" | "Unknown";
export interface Segment {
  id?: string;
  speaker: Speaker;
  start_seconds: number;
  text: string;
}

export const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
