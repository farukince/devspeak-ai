import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/auth/client';
import { isSupabaseConfigured } from '@/lib/auth/config';

export interface UserData {
  userId: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  'custom:job_title'?: string;
  'custom:english_level'?: string;
}

function mapUser(user: User): UserData {
  return {
    userId: user.id,
    email: user.email,
    given_name: user.user_metadata?.given_name ?? user.user_metadata?.first_name,
    family_name: user.user_metadata?.family_name ?? user.user_metadata?.last_name,
    birthdate: user.user_metadata?.birthdate,
    'custom:job_title': user.user_metadata?.job_title,
    'custom:english_level': user.user_metadata?.english_level,
  };
}

export async function getCurrentUser(): Promise<UserData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return mapUser(data.user);
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export function getDisplayName(user: UserData | null): string {
  if (!user) return 'User';
  if (user.given_name && user.family_name) {
    return `${user.given_name} ${user.family_name}`;
  }
  if (user.given_name) return user.given_name;
  return user.email?.split('@')[0] || 'User';
}
