# MedScribe

MedScribe is a doctor-facing consultation documentation app with username/password sign-in, patient records, microphone recording, AI transcription, grounded clinical-note structuring, draft/finalize flow, and print-friendly notes.

## Authentication

Authentication uses Supabase username/password sessions. Usernames are mapped internally to a nondeliverable identity address so doctors sign in with a username rather than a contact email. No Lovable authentication is used.

For username-only registration, disable **Confirm email** in the Supabase project's email/password provider and configure the desired password minimum.

## Real AI transcription and note generation

The runtime no longer uses the demo transcription or keyword-based note generator.

- Browser audio chunks are sent to `/api/transcribe`.
- The server authenticates the doctor's Supabase access token before calling OpenAI.
- Transcription defaults to `gpt-transcribe`.
- `/api/structure-note` sends the consultation transcript to the Responses API with strict structured JSON output.
- Note generation is instructed to extract only information supported by the transcript. Doctor Assessment, Doctor Plan, vitals, diagnosis, prescribing, triage, and treatment recommendations remain outside the AI output contract.
- The OpenAI API key is server-only and must never use a `VITE_` prefix.

## Environment

Copy `.env.example` to `.env` and fill in your own values:

```powershell
Copy-Item .env.example .env
```

Required for the app:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
```

Optional model overrides:

```text
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_NOTE_MODEL=gpt-6-luna
```

`DATABASE_URL` is needed only when using the Drizzle CLI.

## Run locally on Windows PowerShell

Use Node.js 22.12+.

```powershell
npm.cmd install
npm.cmd run dev
```

## Verify

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
```

Microphone access requires HTTPS outside localhost.

## Stack

- React 19
- TypeScript
- TanStack Start / Router / Query
- Tailwind CSS
- Supabase Auth + Postgres
- OpenAI transcription + Responses API
