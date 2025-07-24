import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const signUpDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not available';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account details.</p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>This is the information associated with your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-lg font-semibold">{user.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                <span className="text-lg">{signUpDate}</span>
              </div>
              {/* Future features placeholder */}
              <div className="pt-4">
                <p className="text-sm text-muted-foreground italic">
                  More features like changing your password and uploading a profile picture will be available here soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}