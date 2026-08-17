# DevSpeak AI

Practice professional English for real software-team work: stand-ups, interviews, code reviews, pair programming, and technical writing.

DevSpeak AI is not a general English course. You submit a realistic answer, receive structured AI feedback, retry with an improved version, and track progress over time.

<p align="center">
  <img src="docs/screenshots/home-light.png" alt="DevSpeak AI landing page in light theme" width="48%" />
  <img src="docs/screenshots/home-dark.png" alt="DevSpeak AI landing page in dark theme" width="48%" />
</p>

<p align="center"><em>Light and dark landing page — same layout, grayscale theme.</em></p>

## What you can practice

| Module | What you do | Voice |
| --- | --- | --- |
| **Daily Stand-up** | Yesterday / Today / Blockers updates | Yes |
| **Technical Interview** | Role-based questions with technical + communication scores | Yes |
| **Technical Writing** | PRs, bug reports, READMEs, docs, Slack messages | — |
| **Code Review** | Reviewer comments or author responses | — |
| **Pair Programming** | Driver and navigator communication | — |
| **Progress** | Completed sessions, score trends, focus areas | — |

The UI only surfaces features the backend actually supports.

## How a practice session works

```text
Choose a module
→ Write or speak an answer
→ Get structured AI evaluation
→ Retry with the improved answer
→ Session is saved
→ Dashboard and Progress update
```

Feedback typically includes an overall score, summary, strengths, improvements, an improved answer, and category scores.

## Screenshots

### Landing

![Landing page](docs/screenshots/home-light.png)

### Sign in

![Login page](docs/screenshots/login.png)

After sign-in, a persistent sidebar stays across Dashboard, practice modules, Progress, Profile, and Settings. Theme can be light, dark, or system.

## Stack

- **App:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI:** Headless UI + native HTML components, Lucide icons
- **Auth & data:** Supabase Auth + PostgreSQL with RLS
- **AI:** Google Gemini for evaluation and voice transcription
- **Validation:** Zod request/response schemas

## Run locally

```bash
npm install
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Then apply the migrations in `supabase/migrations` to your Supabase project and start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run type-check
npm run test
npm run lint
npm run build
```

## Project layout

```text
app/            Pages and API routes
components/     App shell, voice recorder, shared UI
lib/ai/         Prompts, schemas, evaluation, transcription
lib/auth/       Supabase session and middleware
lib/database/   Persistence layer
supabase/       Migrations and RLS tests
tests/          Contract and security tests
```

## Privacy

Practice answers, transcripts, and evaluations are stored per user under Row Level Security. See [Privacy](app/privacy/page.tsx) in the app for the product-facing policy.
