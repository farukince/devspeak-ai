'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';
import { getCurrentUser, getDisplayName, type UserData } from '@/lib/authHelpers';
import DashboardLayout from '@/components/DashboardLayout';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-white dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  const jobTitle = user?.['custom:job_title'] || 'Software Developer';
  const englishLevel = user?.['custom:english_level'] || 'Intermediate';
  const displayName = getDisplayName(user);

  return (
    <DashboardLayout user={user}>
      <div className="flex-1 p-6 lg:p-8 bg-warm-white dark:bg-background-dark">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-text-secondary">Manage your account information and preferences.</p>
          </div>

          {/* Profile Card */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-6 mb-8">
              <div className="size-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.given_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                <p className="text-text-secondary">{jobTitle}</p>
                <p className="text-sm text-text-secondary mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">First Name</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{user?.given_name || 'Not set'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Last Name</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{user?.family_name || 'Not set'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Email</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Job Title</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{jobTitle}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">English Level</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{englishLevel}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Birthday</label>
                <div className="p-3 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <p className="text-foreground">{user?.birthdate || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Profile editing will be available soon. Contact support if you need to update your information.
              </p>
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
