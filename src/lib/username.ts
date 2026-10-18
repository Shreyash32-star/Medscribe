// A stable, private identifier for Supabase password authentication.
// These are not contact addresses and must never receive confirmation mail.
const ACCOUNT_DOMAIN = "users.medscribe.invalid";

export function normalizeUsername(value: string): string {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]{2,31}$/.test(username)) {
    throw new Error("Use 3–32 letters, numbers or underscores; start with a letter or number.");
  }
  return username;
}

export function usernameIdentity(value: string): string {
  return `${normalizeUsername(value)}@${ACCOUNT_DOMAIN}`;
}

export function signInIdentity(value: string): string {
  // Keep pre-existing email accounts accessible without changing their user IDs.
  return value.includes("@") ? value.trim().toLowerCase() : usernameIdentity(value);
}

export function contactEmail(value?: string | null): string {
  return value?.endsWith(`@${ACCOUNT_DOMAIN}`) ? "" : value ?? "";
}
