'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

const MODULE_LINKS = [
  { href: '/modules/standup', label: 'Stand-up', icon: 'groups', emoji: '🎯' },
  { href: '/modules/interview', label: 'Interview', icon: 'code', emoji: '💼' },
  { href: '/modules/code-review', label: 'Code Review', icon: 'rate_review', emoji: '🔍' },
  { href: '/modules/pair-programming', label: 'Pair Programming', icon: 'terminal', emoji: '👥' },
  { href: '/modules/writing', label: 'Writing', icon: 'edit_document', emoji: '✍️' },
];

interface UserData {
  email?: string;
  given_name?: string;
  family_name?: string;
  'custom:job_title'?: string;
}

export default function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserData | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = user?.given_name && user?.family_name
    ? `${user.given_name} ${user.family_name}`
    : user?.email?.split('@')[0] || 'Developer';

  const getInitial = () => {
    if (user?.given_name) return user.given_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="bg-warm-white dark:bg-background-dark text-foreground font-display overflow-x-hidden min-h-screen flex flex-row">
      {/* Sidebar */}
      <div className="hidden lg:flex w-72 flex-col border-r border-cream-dark/40 dark:border-border-dark bg-cream dark:bg-surface-dark sticky top-0 h-screen">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 group">
              <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-bold leading-normal bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">DevSpeak AI</h1>
                <p className="text-text-secondary text-sm font-normal leading-normal">Developer Dashboard</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-1.5">
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive('/dashboard')
                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm'
                  : 'text-text-secondary hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 hover:text-foreground'
                  }`}
              >
                <span className="text-xl">📊</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </Link>

              {/* Practice Section */}
              <div className="mt-4 mb-2">
                <p className="px-3 text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="w-8 h-px bg-gradient-to-r from-primary/50 to-transparent"></span>
                  Practice
                  <span className="flex-1 h-px bg-gradient-to-l from-primary/50 to-transparent"></span>
                </p>
              </div>

              {/* Module Links */}
              {MODULE_LINKS.map(({ href, label, emoji }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive(href)
                    ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm'
                    : 'text-text-secondary hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 hover:text-foreground'
                    }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-sm font-medium leading-normal">{label}</p>
                </Link>
              ))}

              {/* Divider */}
              <div className="my-3 h-px bg-gradient-to-r from-transparent via-cream-dark dark:via-border-dark to-transparent"></div>

              {/* Analytics Link */}
              <Link
                href="/analytics"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive('/analytics')
                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm'
                  : 'text-text-secondary hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 hover:text-foreground'
                  }`}
              >
                <span className="text-xl">📈</span>
                <p className="text-sm font-medium leading-normal">Analytics</p>
              </Link>

              {/* Settings Link */}
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive('/settings')
                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm'
                  : 'text-text-secondary hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 hover:text-foreground'
                  }`}
              >
                <span className="text-xl">⚙️</span>
                <p className="text-sm font-medium leading-normal">Settings</p>
              </Link>
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-cream-dark/30 dark:bg-border-dark/30 border border-cream-dark/40 dark:border-border-dark">
              <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold shadow-md">
                {getInitial()}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-foreground text-sm font-semibold truncate">{displayName}</p>
                <p className="text-text-secondary text-xs font-normal truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all w-full text-left border border-transparent hover:border-red-200 dark:hover:border-red-800"
            >
              <span className="text-xl">👋</span>
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-cream-dark/40 dark:border-border-dark bg-cream dark:bg-surface-dark">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">DevSpeak AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg hover:bg-cream-dark/50 dark:hover:bg-border-dark/50 transition-colors">
              <span className="material-symbols-outlined text-foreground">menu</span>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
