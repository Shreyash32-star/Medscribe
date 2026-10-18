import { createFileRoute } from "@tanstack/react-router";
import { getOpenAIConfig, openAIError, requireAuthenticatedUser } from "@/lib/server/ai-auth";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await requireAuthenticatedUser(request);

        const incoming = await request.formData();
        const audio = incoming.get("audio");
        if (!(audio instanceof File) || audio.size === 0) {
          return Response.json({ error: "Audio file is required" }, { status: 400 });
        }
        if (audio.size > MAX_AUDIO_BYTES) {
          return Response.json({ error: "Audio chunk is too large" }, { status: 413 });
        }

        const { apiKey, transcriptionModel } = getOpenAIConfig();
        const form = new FormData();
        form.append("file", audio, audio.name || "consultation.webm");
        form.append("model", transcriptionModel);
        form.append("response_format", "json");
        form.append(
          "prompt",
          "Medical consultation. Preserve the spoken language, including Hindi, Marathi, English, and mixed-language medical terminology. Do not add words that were not spoken.",
        );

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        if (!response.ok) return openAIError(response);

        const result = (await response.json()) as { text?: string };
        return Response.json({ text: (result.text || "").trim() });
      },
    },
  },
});
