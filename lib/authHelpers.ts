export interface UserData {
  userId: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  'custom:job_title'?: string;
  'custom:english_level'?: string;
}

export async function getCurrentUser(): Promise<UserData | null> {
  return null;
}

export function getDisplayName(user: UserData | null): string {
  if (!user) return 'User';
  if (user.given_name && user.family_name) {
    return `${user.given_name} ${user.family_name}`;
  }
  if (user.given_name) return user.given_name;
  return user.email?.split('@')[0] || 'User';
}
