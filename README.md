# MedScribe

Doctor onboarding, patients, consultation recording and clinical notes built with React, TanStack Start, Tailwind and Supabase. Authentication uses username and password, with no Lovable login, preview-session bridge or build dependency.

## Run locally (Windows PowerShell)

Use Node.js 22.12+.

```powershell
Copy-Item .env.example .env
# Fill in your Supabase URL and publishable key in .env.
npm.cmd ci
npm.cmd run dev
```

## Required authentication setup

In the Supabase project used by `.env`, open **Authentication → Sign In / Providers → Email**:

- Enable email/password authentication and new user signups.
- Turn **Confirm email OFF** for this username-only application.
- Set the minimum password length to **12**. The registration form also requires 12 characters.
- Keep provider rate limits enabled. Do not enable anonymous sign-in.

A normalized username (3–32 letters, numbers or underscores) maps deterministically to `username@users.medscribe.invalid`, an internal identifier, not a deliverable email address. Supabase hashes and verifies passwords and issues real sessions; per-doctor RLS remains enforced. Passwords are never stored in application localStorage or source code. Usernames are case-insensitive. Do not use the internal address for email recovery; account recovery requires a verified administrator process. Changing profile contact email does not change the login identifier.

Registration checks the backend setting first and refuses to send confirmation emails or create unusable accounts while confirmation is enabled. Existing email/password accounts can still use their original email in the Username field; their IDs and medical records are unchanged. There is no shared/default password.

**Upload-time status:** the source project's `kzbwvbfpdmpgiftscmdd` backend has Confirm email enabled and is not accessible through the connected Supabase management account. Username-only registration will remain blocked until its administrator turns this setting off. This repository upload does not migrate the database away from its existing host.

For a fresh Supabase project, apply `drizzle/migrations/0000_migration.sql` once to create the application tables, doctor profile trigger and per-doctor RLS policies. Do not reapply it to an existing database. Configure the four variables from `.env.example` in your hosting environment. No admin/service-role key is needed by the app, and none should be placed in frontend variables.

## Build and verify

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd start
```

The standard Nitro build produces `.output`; production starts with `node .output/server/index.mjs`. HTTPS is required for microphone access outside localhost. Raw audio remains in memory only. Transcription and note structuring implementations are in `src/lib/services`; the existing demo/provider behavior is unchanged.
