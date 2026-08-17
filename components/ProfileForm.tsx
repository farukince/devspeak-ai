'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { onboardingInputSchema } from '@/lib/database/schemas';

export interface ProfileFormValues {
  displayName: string;
  jobTitle: string;
  experienceLevel: 'Junior' | 'Mid-level' | 'Senior' | 'Lead';
  englishLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  nativeLanguage: string;
  timezone: string;
}

const fieldClass =
  'w-full rounded-md border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring';

export function ProfileForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ProfileFormValues;
  submitLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <Key extends keyof ProfileFormValues>(key: Key, value: ProfileFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = onboardingInputSchema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your profile details.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Profile could not be saved.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Display name" htmlFor="displayName">
          <input id="displayName" value={values.displayName} onChange={(event) => update('displayName', event.target.value)} className={fieldClass} placeholder="Faruk İnce" autoComplete="name" required />
        </Field>
        <Field label="Job title" htmlFor="jobTitle">
          <input id="jobTitle" value={values.jobTitle} onChange={(event) => update('jobTitle', event.target.value)} className={fieldClass} placeholder="Frontend Developer" autoComplete="organization-title" required />
        </Field>
        <Field label="Experience level" htmlFor="experienceLevel">
          <select id="experienceLevel" value={values.experienceLevel} onChange={(event) => update('experienceLevel', event.target.value as ProfileFormValues['experienceLevel'])} className={fieldClass} required>
            {['Junior', 'Mid-level', 'Senior', 'Lead'].map((level) => <option key={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="English level (CEFR)" htmlFor="englishLevel">
          <select id="englishLevel" value={values.englishLevel} onChange={(event) => update('englishLevel', event.target.value as ProfileFormValues['englishLevel'])} className={fieldClass} required>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => <option key={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="Native language" htmlFor="nativeLanguage">
          <input id="nativeLanguage" value={values.nativeLanguage} onChange={(event) => update('nativeLanguage', event.target.value)} className={fieldClass} placeholder="Turkish" autoComplete="language" required />
        </Field>
        <Field label="Timezone" htmlFor="timezone">
          <input id="timezone" value={values.timezone} onChange={(event) => update('timezone', event.target.value)} className={fieldClass} placeholder="Europe/Istanbul" list="timezone-options" required />
          <datalist id="timezone-options">
            {['Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Singapore'].map((timezone) => (
              <option key={timezone} value={timezone} />
            ))}
          </datalist>
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary py-3 font-semibold text-primary-foreground transition-theme hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
