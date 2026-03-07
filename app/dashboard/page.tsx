'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import DashboardLayout from '@/components/DashboardLayout';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

interface UserData {
  email?: string;
  given_name?: string;
  family_name?: string;
}

interface ProgressData {
  totalSessions: number;
  heatmapData: { day: string; value: number }[];
  scoreTrends: { date: string; [key: string]: number | string }[];
  moduleAnalysis?: { strongestModule: { name: string; score: number }; weakestModule: { name: string; score: number } };
  recentActivity?: {
    module: string;
    task_name: string;
    date: string;
    score: number | null;
    ai_feedback: string;
  }[];
}

function formatModuleName(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getScoreColor(score: number | null) {
  if (score === null) return 'text-text-secondary bg-cream-dark/30 dark:bg-border-dark/30';
  if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        router.push('/login');
        return;
      }

      const attributes = await fetchUserAttributes();
      setUser({
        email: attributes.email,
        given_name: attributes.given_name,
        family_name: attributes.family_name,
      });

      // Fetch progress data
      fetchProgressData();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/progress-data');
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-white dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading dashboard...</p>
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
              Welcome back, {user?.given_name || 'Developer'}! 👋
            </h1>
            <p className="text-text-secondary">Track your progress and continue improving your communication skills.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {progressLoading ? '...' : progress?.totalSessions || 0}
                  </p>
                </div>
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Strongest Module</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {progressLoading ? '...' : formatModuleName(progress?.moduleAnalysis?.strongestModule?.name || 'N/A')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {progress?.moduleAnalysis?.strongestModule?.score || 0}% avg
                  </p>
                </div>
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </div>

            <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Focus Area</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {progressLoading ? '...' : formatModuleName(progress?.moduleAnalysis?.weakestModule?.name || 'N/A')}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {progress?.moduleAnalysis?.weakestModule?.score || 0}% avg
                  </p>
                </div>
                <div className="size-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          {progress?.heatmapData && progress.heatmapData.length > 0 && (
            <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Activity Overview</h2>
              <ActivityHeatmap data={progress.heatmapData} />
            </div>
          )}

          {/* Practice Modules */}
          <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Practice Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/modules/standup', title: 'Stand-up', emoji: '🎯', desc: 'Daily updates' },
                { href: '/modules/interview', title: 'Interview', emoji: '💼', desc: 'Technical questions' },
                { href: '/modules/code-review', title: 'Code Review', emoji: '🔍', desc: 'Review feedback' },
                { href: '/modules/pair-programming', title: 'Pair Programming', emoji: '👥', desc: 'Collaborative coding' },
                { href: '/modules/writing', title: 'Writing', emoji: '✍️', desc: 'Technical docs' },
              ].map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="flex items-center gap-4 p-4 rounded-xl border border-cream-dark/40 dark:border-border-dark hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">{module.emoji}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{module.title}</p>
                    <p className="text-sm text-text-secondary">{module.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {progress?.recentActivity && progress.recentActivity.length > 0 && (
            <div className="bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {progress.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-cream-dark/40 dark:border-border-dark">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{formatModuleName(activity.module)}</p>
                        {activity.score !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreColor(activity.score)}`}>
                            {activity.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
