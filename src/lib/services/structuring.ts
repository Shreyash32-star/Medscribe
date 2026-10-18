import type { NoteFields, NoteFieldKey, Segment } from "@/lib/notes-schema";

/**
 * NOTE STRUCTURING SERVICE ABSTRACTION
 * ------------------------------------
 * Contract: organise ONLY what was said in the transcript into documentation fields.
 * It must never diagnose, suggest treatment, prescribe, triage, or write the
 * Doctor Assessment / Doctor Plan (those are not part of the output type at all).
 *
 * Replace `MockStructuringService` with a local/open-source LLM (e.g. Llama/Mistral via
 * Ollama or vLLM) prompted to extract verbatim-grounded text per field and to return
 * an empty string when the transcript does not mention a field.
 */
export interface StructuringService {
  readonly name: string;
  structure(segments: Segment[]): Promise<NoteFields>;
}

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

/** Mock: keyword-based sentence routing. Output is verbatim transcript text only. */
export class MockStructuringService implements StructuringService {
  readonly name = "Mock structuring (keyword-based demo)";
  async structure(segments: Segment[]): Promise<NoteFields> {
    await new Promise((r) => setTimeout(r, 600));
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
    if (patientLines.length) out["hpi"] = [patientLines.slice(0, 4).join(" ")];
    const fields: NoteFields = {};
    for (const [k, v] of Object.entries(out)) {
      fields[k as NoteFieldKey] = Array.from(new Set(v)).map((l) => `“${l}”`).join("\n");
    }
    return fields;
  }
}

export const structuringService: StructuringService = new MockStructuringService();
