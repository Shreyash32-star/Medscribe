import type { Segment } from "@/lib/notes-schema";

/**
 * TRANSCRIPTION SERVICE ABSTRACTION
 * ---------------------------------
 * Replace `MockTranscriptionService` with a real implementation that POSTs the
 * audio chunk to a self-hosted faster-whisper / Whisper server, e.g.:
 *
 *   class WhisperTranscriptionService implements TranscriptionService {
 *     async transcribeChunk(audio, offset) {
 *       const form = new FormData(); form.append("file", audio);
 *       const res = await fetch(WHISPER_URL + "/transcribe", { method: "POST", body: form });
 *       const { segments } = await res.json();
 *       return segments.map(s => ({ speaker: "Unknown", start_seconds: offset + s.start, text: s.text }));
 *     }
 *   }
 *
 * Audio chunks are held in memory only and are never persisted by this app.
 */
export interface TranscriptionService {
  readonly name: string;
  transcribeChunk(audio: Blob, offsetSeconds: number): Promise<Segment[]>;
  reset(): void;
}

const MOCK_LINES: Array<Pick<Segment, "speaker" | "text">> = [
  { speaker: "Doctor", text: "Namaste, aaj kya takleef hai?" },
  { speaker: "Patient", text: "Doctor, mujhe teen din se sar dard ho raha hai." },
  { speaker: "Doctor", text: "Koi bukhaar ya ulti?" },
  { speaker: "Patient", text: "Nahi, bukhaar nahi hai. Thoda chakkar aata hai." },
  { speaker: "Doctor", text: "Theek hai, ek hafte baad follow up ke liye aaiye." },
];

/** Mock: returns scripted lines (clearly marked) instead of real speech recognition. */
export class MockTranscriptionService implements TranscriptionService {
  readonly name = "Mock transcription (demo)";
  private i = 0;
  async transcribeChunk(_audio: Blob, offsetSeconds: number): Promise<Segment[]> {
    await new Promise((r) => setTimeout(r, 300));
    const line = MOCK_LINES[this.i % MOCK_LINES.length]!;
    this.i++;
    return [{ speaker: line.speaker, start_seconds: Math.max(0, Math.round(offsetSeconds)), text: `[mock] ${line.text}` }];
  }
  reset() {
    this.i = 0;
  }
}

export const transcriptionService: TranscriptionService = new MockTranscriptionService();
