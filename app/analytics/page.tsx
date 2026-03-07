'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';
import { getCurrentUser, type UserData } from '@/lib/authHelpers';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

export default function AnalyticsPage() {
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
          <p className="text-text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="flex-1 p-6 lg:p-8 bg-warm-white dark:bg-background-dark">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-text-secondary">Deep insights into your communication skills development.</p>
          </div>

          {/* Coming Soon */}
          <Card className="bg-cream dark:bg-surface-dark border-cream-dark/40 dark:border-border-dark">
            <CardHeader>
              <CardTitle>Advanced Analytics Coming Soon</CardTitle>
              <CardDescription>
                We're building comprehensive analytics to help you track your progress in detail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <h3 className="font-semibold">Detailed Metrics</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Track your scores across all modules with detailed breakdowns and trends.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📈</span>
                    <h3 className="font-semibold">Progress Charts</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Visualize your improvement over time with interactive charts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎯</span>
                    <h3 className="font-semibold">Goal Tracking</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Set and track personal goals for each communication skill.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warm-white dark:bg-background-dark border border-cream-dark/40 dark:border-border-dark">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏆</span>
                    <h3 className="font-semibold">Achievements</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Earn badges and achievements as you reach milestones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
