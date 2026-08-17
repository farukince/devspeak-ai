'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm, type ProfileFormValues } from '@/components/ProfileForm';
import { getCurrentUser, type UserData } from '@/lib/authHelpers';
import { createUserProfile, getUserProfile, updateUserProfile, type UserProfile } from '@/lib/dataClient';
import { isProfileComplete } from '@/lib/profile';

function defaultValues(user: UserData, profile: UserProfile | null): ProfileFormValues {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  const englishLevel = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(profile?.englishLevel ?? '')
    ? profile?.englishLevel as ProfileFormValues['englishLevel']
    : 'B1';
  const experienceLevel = ['Junior', 'Mid-level', 'Senior', 'Lead'].includes(profile?.experienceLevel ?? '')
    ? profile?.experienceLevel as ProfileFormValues['experienceLevel']
    : 'Mid-level';

  return {
    displayName: profile?.fullName ?? [user.given_name, user.family_name].filter(Boolean).join(' '),
    jobTitle: profile?.jobTitle ?? '',
    experienceLevel,
    englishLevel,
    nativeLanguage: profile?.nativeLanguage ?? '',
    timezone: profile?.timezone ?? browserTimezone,
  };
}

export default function OnboardingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        if (isProfileComplete(currentProfile)) {
          router.replace('/dashboard');
          return;
        }
        setUser(currentUser);
        setProfile(currentProfile);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Profile could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const save = async (values: ProfileFormValues) => {
    if (!user) throw new Error('Authentication required.');
    const updates = { ...values, fullName: values.displayName, onboardingCompleted: true };
    if (profile) {
      await updateUserProfile(user.userId, updates);
    } else {
      await createUserProfile({ userId: user.userId, email: user.email ?? '', ...updates });
    }
    router.replace('/dashboard');
    router.refresh();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading profile...</div>;
  }

  if (loadError || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-red-500">{loadError ?? 'Authentication required.'}</div>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Complete your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">We use these details to personalize technical communication practice.</p>
        </div>
        <ProfileForm initialValues={defaultValues(user, profile)} submitLabel="Continue to Dashboard" onSubmit={save} />
      </div>
    </main>
  );
}
