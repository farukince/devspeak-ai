'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Amplify } from 'aws-amplify';
import { awsConfig } from '@/lib/awsConfig';
import { getCurrentUser } from '@/lib/authHelpers';
import { createUserProfile, updateUserProfile, getUserProfile } from '@/lib/dynamoDBClient';

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

export default function OnboardingPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [englishLevel, setEnglishLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user profile exists in DynamoDB
    try {
      const profile = await getUserProfile(user.userId);
      if (profile?.jobTitle) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if profile exists
      const existingProfile = await getUserProfile(user.userId);

      if (existingProfile) {
        // Update existing profile
        await updateUserProfile(user.userId, {
          jobTitle,
          englishLevel,
          onboardingCompleted: true,
        });
      } else {
        // Create new profile
        await createUserProfile({
          userId: user.userId,
          email: user.signInDetails?.loginId || '',
          firstName: user.given_name,
          lastName: user.family_name,
          fullName: `${user.given_name} ${user.family_name}`,
          jobTitle,
          englishLevel,
          onboardingCompleted: true,
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white dark:bg-background-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-cream dark:bg-surface-dark border border-cream-dark/40 dark:border-border-dark rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🎯</span>
          <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-text-secondary">Help us personalize your experience</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-semibold mb-2">
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-dark/40 dark:border-border-dark bg-warm-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="englishLevel" className="block text-sm font-semibold mb-2">
              English Level
            </label>
            <select
              id="englishLevel"
              value={englishLevel}
              onChange={(e) => setEnglishLevel(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-dark/40 dark:border-border-dark bg-warm-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Native">Native</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
