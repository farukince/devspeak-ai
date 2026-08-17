'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/auth/client';
import { getCurrentUser, type UserData } from '@/lib/authHelpers';
import { getUserProfile, type UserProfile } from '@/lib/dataClient';
import { isProfileComplete } from '@/lib/profile';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Account could not be deleted.');
      await createClient().auth.signOut({ scope: 'local' });
      router.replace('/login?accountDeleted=1');
      router.refresh();
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : 'Account could not be deleted.');
      setDeleting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const userData = await getCurrentUser();
      if (!userData) {
        router.push('/login');
        return;
      }
      const profileData = await getUserProfile(userData.userId);
      if (!isProfileComplete(profileData)) {
        router.replace('/onboarding');
        return;
      }
      setUser(userData);
      setProfile(profileData);
      setLoading(false);
    };
    void load();
  }, [router]);

  if (loading || !mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage account, appearance, and coaching profile.</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{profile?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Link href="/profile" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            Edit profile
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {themes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTheme(item.value)}
              className={cn(
                'rounded-md border px-3 py-4 text-sm font-medium transition-theme',
                theme === item.value ? 'border-foreground bg-muted' : 'border-border hover:bg-accent'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Coaching profile</h2>
          <Link href="/profile" className="text-sm font-medium underline-offset-4 hover:underline">Edit</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['Job title', profile?.jobTitle],
            ['Experience', profile?.experienceLevel],
            ['English level', profile?.englishLevel],
            ['Native language', profile?.nativeLanguage],
            ['Timezone', profile?.timezone],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium">{value || 'Not set'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-red-500/40 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-300">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently deletes your profile, practice sessions, evaluations, AI usage records, and authentication account.
        </p>
        <label className="mt-5 block text-sm font-medium text-muted-foreground">
          Type DELETE to confirm
          <input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            className="mt-2 w-full rounded-md border border-red-500/30 bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        {deleteError && <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-300">{deleteError}</p>}
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting || deleteConfirmation !== 'DELETE'}
          className="mt-4 rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Deleting account…' : 'Permanently delete account'}
        </button>
      </section>
    </div>
  );
}
