import { createFileRoute } from "@tanstack/react-router";
import { AI_NOTE_FIELDS, type Segment } from "@/lib/notes-schema";
import { getOpenAIConfig, openAIError, requireAuthenticatedUser } from "@/lib/server/ai-auth";

const MAX_TRANSCRIPT_CHARS = 60_000;
const keys = AI_NOTE_FIELDS.map((field) => field.key);
const properties = Object.fromEntries(keys.map((key) => [key, { type: "string" }])) as Record<string, { type: "string" }>;

function outputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === "string") return part.text;
    }
  }
  return "";
}

export const Route = createFileRoute("/api/structure-note")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await requireAuthenticatedUser(request);
        const body = (await request.json().catch(() => null)) as { segments?: Segment[] } | null;
        const segments = Array.isArray(body?.segments) ? body!.segments : [];
        if (!segments.length) return Response.json({ fields: {} });

        const transcript = segments
          .filter((segment) => typeof segment?.text === "string" && segment.text.trim())
          .map((segment) => `[${Math.max(0, Number(segment.start_seconds) || 0)}s] ${segment.speaker || "Unknown"}: ${segment.text.trim()}`)
          .join("\n")
          .slice(0, MAX_TRANSCRIPT_CHARS);

        if (!transcript) return Response.json({ fields: {} });

        const { apiKey, noteModel } = getOpenAIConfig();
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: noteModel,
            instructions:
              "You are a medical scribe, not a clinician. Extract documentation only from the consultation transcript. Never diagnose, infer a diagnosis, recommend treatment, prescribe, triage, or invent details. Preserve clinically meaningful wording and negations. If a field is not explicitly supported by the transcript, return an empty string. Doctor Assessment, Doctor Plan, vitals, and examination are manual-only and must never appear in your output. For follow_up, include only instructions actually stated by the doctor.",
            input: `Structure this consultation transcript into the requested fields.\n\n${transcript}`,
            text: {
              format: {
                type: "json_schema",
                name: "medscribe_grounded_note",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties,
                  required: keys,
                },
              },
            },
          }),
        });
        if (!response.ok) return openAIError(response);

        const payload = await response.json();
        const text = outputText(payload);
        if (!text) return Response.json({ error: "AI returned no note" }, { status: 502 });

        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          const fields: Record<string, string> = {};
          for (const key of keys) {
            const value = parsed[key];
            if (typeof value === "string" && value.trim()) fields[key] = value.trim();
          }
          return Response.json({ fields });
        } catch {
          console.error("Could not parse structured AI note response");
          return Response.json({ error: "AI returned an invalid note" }, { status: 502 });
        }
      },
    },
  },
});
