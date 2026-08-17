export interface ProfileCompletionData {
  fullName?: string | null;
  jobTitle?: string | null;
  experienceLevel?: string | null;
  englishLevel?: string | null;
  nativeLanguage?: string | null;
  timezone?: string | null;
  onboardingCompleted?: boolean | null;
}

export function isProfileComplete(profile: ProfileCompletionData | null | undefined) {
  return Boolean(
    profile?.onboardingCompleted
    && profile.fullName?.trim()
    && profile.jobTitle?.trim()
    && profile.experienceLevel?.trim()
    && profile.englishLevel?.trim()
    && profile.nativeLanguage?.trim()
    && profile.timezone?.trim()
  );
}
