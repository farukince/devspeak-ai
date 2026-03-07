import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

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
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return null;
    }

    const userId = session.tokens.idToken?.payload.sub as string;
    const attributes = await fetchUserAttributes();
    
    return {
      userId,
      email: attributes.email,
      given_name: attributes.given_name,
      family_name: attributes.family_name,
      birthdate: attributes.birthdate,
      'custom:job_title': attributes['custom:job_title'],
      'custom:english_level': attributes['custom:english_level'],
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function getDisplayName(user: UserData | null): string {
  if (!user) return 'User';
  if (user.given_name && user.family_name) {
    return `${user.given_name} ${user.family_name}`;
  }
  if (user.given_name) return user.given_name;
  return user.email?.split('@')[0] || 'User';
}
