export function getSafeRedirectPath(value: string | null, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  return value;
}

export function getSiteUrl(origin?: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || origin || 'http://localhost:3000').replace(/\/$/, '');
}
