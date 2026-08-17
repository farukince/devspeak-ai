# DevSpeak AI Privacy Data Flow

## Data collected

- Supabase Auth stores email, authentication identities, and session metadata.
- `profiles` stores the user-provided coaching profile.
- `practice_sessions` stores module, answer or transcript, duration, status, and timestamps.
- `evaluations` stores scores, feedback, strengths, improvements, and improved answers.
- `ai_runs` stores provider/model identifiers, prompt version, token usage, latency, estimated cost, request ID, and error code. API keys are never stored here.
- `api_rate_limits` stores user ID, endpoint, time window, and request count.

## Provider flow

Written answers and confirmed voice transcripts are sent server-side to Gemini for evaluation. Voice recordings are uploaded to the Next.js server and sent to Gemini for transcription. Raw audio is held only in request memory and is not persisted in Supabase or local storage. Gemini credentials remain server-only.

## Access and isolation

Supabase Row Level Security restricts profiles, sessions, evaluations, AI runs, and goals to their owner. Active shared scenarios are read-only. Anonymous database table access is revoked. Route handlers validate authentication, ownership, body size, schema, and rate limits.

## Retention and deletion

Practice data remains until the user deletes the account. Settings → Delete Account calls a current-user-only database function. Deleting the auth user cascades to the profile, practice sessions, evaluations, AI runs, goals, and rate-limit records. Shared scenarios remain because they contain no user data.

## Operational logs

Application logs must not contain API keys, raw audio, or full answers. Provider errors are converted to safe error codes before being returned to the browser.
