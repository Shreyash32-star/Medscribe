# MedScribe

Do not rewrite published Git history.

## Architecture rules
- Data access is client-side via the generated browser client with per-doctor RLS (`doctor_id = auth.uid()`); authenticated pages live under the `_app` pathless layout with `ssr: false` because the session is browser-only.
- Speech-to-text goes through `src/lib/services/transcription.ts` and note structuring through `src/lib/services/structuring.ts`; swap implementations there (Whisper / local LLM) without touching UI.
- The structuring service output type excludes Doctor Assessment, Doctor Plan and vitals — those are manual-only by design; keep `src/test/structuring.test.ts` passing.
- Raw audio is held in memory only (`use-recorder.ts`) and never persisted unless an explicit retention setting is added.
