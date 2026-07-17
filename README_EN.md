# DevSpeak AI

DevSpeak AI helps software developers practice professional English for work situations such as stand-ups, interviews, code reviews, pair programming, and technical writing.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Recharts

## Provider Status

The previous cloud, auth, database, and AI provider integrations have been removed. The app now exposes neutral integration points:

- `lib/aiClient.ts` for AI responses
- `lib/dataClient.ts` for persistence
- `lib/authHelpers.ts` for authentication state

Wire the next provider into these files without changing the module pages or API route contracts.

## Development

```bash
npm install
npm run dev
```
