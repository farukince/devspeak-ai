'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { isAppShellPath } from '@/lib/navigation/app-nav';

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!isAppShellPath(pathname)) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
