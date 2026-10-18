import { supabase } from "@/integrations/supabase/client";

export async function authHeaders(extra?: HeadersInit): Promise<Headers> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Please sign in again before using AI features.");
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return headers;
}

export async function apiError(response: Response): Promise<Error> {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return new Error(data?.error || `AI request failed (${response.status})`);
}
