import Link from 'next/link';

const sections = [
  ['What we store', 'Authentication identity, coaching profile, practice answers or confirmed transcripts, evaluation results, AI usage metadata, goals, and security rate-limit counters.'],
  ['AI processing', 'Written answers and confirmed transcripts are sent from the server to Gemini for coaching. Voice audio is sent for transcription but is not persisted by DevSpeak AI. API credentials never reach the browser.'],
  ['Access control', 'Supabase Row Level Security isolates user-owned profiles, sessions, evaluations, AI runs, and goals. Anonymous database table access is revoked.'],
  ['Retention and deletion', 'Data remains while the account is active. Settings → Delete Account permanently deletes the authentication account and cascades deletion to all user-owned application records.'],
  ['Operational metadata', 'We record provider/model identifiers, token usage, latency, estimated cost, request IDs, and safe error codes. We do not intentionally write raw audio, API keys, or full answers to application logs.'],
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-black text-foreground">← DevSpeak AI</Link>
        <h1 className="mt-8 text-4xl font-black">Privacy & Data Flow</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">This page explains how the MVP handles personal data and AI processing. Last updated July 23, 2026.</p>
        <div className="mt-10 space-y-5">
          {sections.map(([title, description]) => (
            <section key={title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-black text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-xs leading-6 text-muted-foreground">The detailed engineering data-flow reference is maintained in docs/privacy-data-flow.md.</p>
      </div>
    </main>
  );
}
