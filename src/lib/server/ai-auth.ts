const supabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = () => process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) {
    console.error("Supabase server environment is not configured");
    throw new Response("Server configuration error", { status: 500 });
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      authorization,
      apikey: key,
    },
  });

  if (!response.ok) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return response.json() as Promise<{ id: string }>;
}

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Response("AI is not configured", { status: 503 });
  return {
    apiKey,
    transcriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe",
    noteModel: process.env.OPENAI_NOTE_MODEL || "gpt-6-luna",
  };
}

export async function openAIError(response: Response) {
  const body = await response.text().catch(() => "");
  console.error("OpenAI request failed", response.status, body.slice(0, 1000));
  return Response.json({ error: "AI request failed" }, { status: 502 });
}
