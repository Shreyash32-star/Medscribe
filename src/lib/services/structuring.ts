import type { NoteFields, NoteFieldKey, Segment } from "@/lib/notes-schema";
import { apiError, authHeaders } from "@/lib/services/ai-client";

export interface StructuringService {
  readonly name: string;
  structure(segments: Segment[]): Promise<NoteFields>;
}

export class AIStructuringService implements StructuringService {
  readonly name = "AI clinical note structuring";

  async structure(segments: Segment[]): Promise<NoteFields> {
    if (!segments.some((segment) => segment.text.trim())) return {};

    const response = await fetch("/api/structure-note", {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ segments }),
    });
    if (!response.ok) throw await apiError(response);

    const data = (await response.json()) as { fields?: NoteFields };
    return data.fields || {};
  }
}

// Deterministic test-only implementation retained for safety-contract unit tests.
const RULES: Array<{ key: NoteFieldKey; patterns: RegExp[]; speaker?: "Doctor" | "Patient" }> = [
  { key: "chief_complaint", speaker: "Patient", patterns: [/dard|pain|takleef|problem|cough|khansi|khokla|bukhaar|fever|tap\b|dukh/i] },
  { key: "duration_onset", patterns: [/\b(din|days?|hafte|weeks?|months?|mahine|divas|since|kal se|aathavd)/i] },
  { key: "associated_symptoms", speaker: "Patient", patterns: [/(saath|also|aur |along|chakkar|nausea|ulti|thakan|tired|ghabrahat)/i] },
  { key: "negative_symptoms", speaker: "Patient", patterns: [/\b(nahi|no |not |nahin|nahee|nahi aahe|nai)\b/i] },
  { key: "past_history", patterns: [/(diabetes|sugar|bp|blood pressure|thyroid|asthma|history|pehle|purvi|operation|surgery)/i] },
  { key: "current_medications", patterns: [/(tablet|goli|medicine|dawai|dawa|metformin|amlodipine|syrup|le raha|le rahi|ghet)/i] },
  { key: "allergies", patterns: [/(allerg|reaction)/i] },
  { key: "family_history", patterns: [/(father|mother|papa|mummy|aai|baba|family|parivar|bhai|behen)/i] },
  { key: "social_history", patterns: [/(smok|cigarette|alcohol|daru|sharab|tobacco|gutkha|job|kaam|office|exercise)/i] },
  { key: "investigations", patterns: [/(report|test|x-?ray|cbc|blood test|hba1c|scan|ecg|sonography)/i] },
  { key: "follow_up", speaker: "Doctor", patterns: [/(follow.?up|wapas|phir se aana|parat ya|review|next visit|baad aaiye|baad aana)/i] },
];

const clean = (t: string) => t.replace(/^\[mock\]\s*/i, "").trim();

export class MockStructuringService implements StructuringService {
  readonly name = "Deterministic structuring test helper";
  async structure(segments: Segment[]): Promise<NoteFields> {
    const out: Record<string, string[]> = {};
    for (const seg of segments) {
      const text = clean(seg.text);
      if (!text) continue;
      for (const rule of RULES) {
        if (rule.speaker && seg.speaker !== "Unknown" && seg.speaker !== rule.speaker) continue;
        if (rule.patterns.some((p) => p.test(text))) (out[rule.key] ??= []).push(text);
      }
    }
    const patientLines = segments.filter((s) => s.speaker === "Patient").map((s) => clean(s.text));
    if (patientLines.length) out.hpi = [patientLines.slice(0, 4).join(" ")];
    const fields: NoteFields = {};
    for (const [key, values] of Object.entries(out)) {
      fields[key as NoteFieldKey] = Array.from(new Set(values)).map((line) => `“${line}”`).join("\n");
    }
    return fields;
  }
}

export const structuringService: StructuringService = new AIStructuringService();
