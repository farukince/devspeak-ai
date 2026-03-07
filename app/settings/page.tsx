'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';
import { getCurrentUser, getDisplayName, type UserData } from '@/lib/authHelpers';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkAuth();
    setMounted(true);
  }, []);

  const checkAuth = async () => {
    const userData = await getCurrentUser();
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(userData);
    setLoading(false);
  };

  if (loading || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-white dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);

  return (
    <DashboardLayout user={user}>
      <div className="flex-1 p-6 lg:p-8 bg-warm-white dark:bg-background-dark">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-text-secondary">Customize your DevSpeak AI experience.</p>
          </div>

          {/* Account Section */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                <div>
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-cream-dark/40 dark:border-border-dark hover:border-primary/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">☀️</span>
                      <span className="text-sm font-medium">Light</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-cream-dark/40 dark:border-border-dark hover:border-primary/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">🌙</span>
                      <span className="text-sm font-medium">Dark</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'system'
                        ? 'border-primary bg-primary/10'
                        : 'border-cream-dark/40 dark:border-border-dark hover:border-primary/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">💻</span>
                      <span className="text-sm font-medium">System</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                <div>
                  <p className="font-semibold text-foreground">Email Notifications</p>
                  <p className="text-sm text-text-secondary">Receive updates about your progress</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">About</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Version</span>
                <span className="font-semibold">1.0.0 (AWS)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Region</span>
                <span className="font-semibold">eu-central-1 (Frankfurt)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">AI Model</span>
                <span className="font-semibold">Amazon Nova Pro & Lite</span>
              </div>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>←</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
