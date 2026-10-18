import type { Segment } from "@/lib/notes-schema";
import { apiError, authHeaders } from "@/lib/services/ai-client";

export interface TranscriptionService {
  readonly name: string;
  transcribeChunk(audio: Blob, offsetSeconds: number): Promise<Segment[]>;
  reset(): void;
}

function extensionFor(type: string) {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4") || type.includes("m4a")) return "m4a";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export class AITranscriptionService implements TranscriptionService {
  readonly name = "AI transcription";

  async transcribeChunk(audio: Blob, offsetSeconds: number): Promise<Segment[]> {
    if (!audio.size) return [];

    const form = new FormData();
    const ext = extensionFor(audio.type || "audio/webm");
    form.append("audio", audio, `consultation-${Date.now()}.${ext}`);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: await authHeaders(),
      body: form,
    });
    if (!response.ok) throw await apiError(response);

    const data = (await response.json()) as { text?: string };
    const text = (data.text || "").trim();
    if (!text) return [];

    return [
      {
        speaker: "Unknown",
        start_seconds: Math.max(0, Math.round(offsetSeconds)),
        text,
      },
    ];
  }

  reset() {
    // The provider is stateless per chunk; nothing needs to be reset.
  }
}

export const transcriptionService: TranscriptionService = new AITranscriptionService();
