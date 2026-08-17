'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm, type ProfileFormValues } from '@/components/ProfileForm';
import { getCurrentUser, type UserData } from '@/lib/authHelpers';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/dataClient';
import { isProfileComplete } from '@/lib/profile';

function formValues(profile: UserProfile): ProfileFormValues {
  const experienceLevel = ['Junior', 'Mid-level', 'Senior', 'Lead'].includes(profile.experienceLevel ?? '')
    ? profile.experienceLevel as ProfileFormValues['experienceLevel']
    : 'Mid-level';
  const englishLevel = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(profile.englishLevel ?? '')
    ? profile.englishLevel as ProfileFormValues['englishLevel']
    : 'B1';
  return {
    displayName: profile.fullName ?? '',
    jobTitle: profile.jobTitle ?? '',
    experienceLevel,
    englishLevel,
    nativeLanguage: profile.nativeLanguage ?? '',
    timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.replace('/login');
          return;
        }
        const currentProfile = await getUserProfile(currentUser.userId);
        if (!isProfileComplete(currentProfile)) {
          router.replace('/onboarding');
          return;
        }
        setUser(currentUser);
        setProfile(currentProfile);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Profile could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const save = async (values: ProfileFormValues) => {
    if (!user) throw new Error('Authentication required.');
    const updated = await updateUserProfile(user.userId, { ...values, fullName: values.displayName });
    setProfile(updated);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading profile...</div>;
  }

  if (error || !user || !profile) {
    return <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-red-500">{error ?? 'Profile not found.'}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Keep your coaching profile accurate and up to date.</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {(profile.fullName ?? user.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {saved && (
          <div role="status" className="mb-5 rounded-md border border-border bg-muted p-3 text-sm">
            Profile saved.
          </div>
        )}
        <ProfileForm key={profile.updatedAt} initialValues={formValues(profile)} submitLabel="Save profile" onSubmit={save} />
      </section>
    </div>
  );
}
