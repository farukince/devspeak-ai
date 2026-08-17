import { NextResponse } from 'next/server';
import { buildDashboardData } from '@/lib/dashboard/metrics';
import { getServerDatabase } from '@/lib/database/server';

export async function GET() {
  try {
    const database = await getServerDatabase();
    const [profile, sessions] = await Promise.all([
      database.profiles.read(),
      database.sessions.listCompletedForDashboard(),
    ]);
    return NextResponse.json({
      displayName: profile?.displayName ?? null,
      ...buildDashboardData(sessions),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required.') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Dashboard data failed:', error);
    return NextResponse.json({ error: 'Dashboard data could not be loaded.' }, { status: 500 });
  }
}
