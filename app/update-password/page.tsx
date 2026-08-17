'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Save, Zap } from 'lucide-react';
import { createClient } from '@/lib/auth/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      router.replace('/login?message=password_updated');
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update your password.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-center gap-3 text-xl font-black text-foreground">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="size-5" /></span>
          DevSpeak AI
        </div>
        <h1 className="text-2xl font-black text-foreground">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Use at least eight characters and keep this password unique to DevSpeak AI.</p>
        {error && <p className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <PasswordField label="New Password" value={password} onChange={setPassword} />
          <PasswordField label="Confirm Password" value={confirmation} onChange={setConfirmation} />
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-black text-primary-foreground disabled:opacity-50">
            <Save className="size-4" /> {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="relative block">
        <KeyRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={value} onChange={(event) => onChange(event.target.value)} type="password" required minLength={8} className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-foreground" />
      </span>
    </label>
  );
}
