import { NextRequest, NextResponse } from 'next/server';
import { getUserPracticeSessions } from '@/lib/dynamoDBClient';
import { startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
    }

    // 2. Get all practice sessions from DynamoDB
    const sessions = await getUserPracticeSessions(userId);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No practice sessions found.' });
    }

    // --- DATA PROCESSING ---

    // 3. Calculate general statistics
    const totalSessions = sessions.length;
    const firstPracticeDate = sessions[0].createdAt;

    // 4. Prepare heatmap data
    const heatmapData = sessions.reduce((acc: { [key: string]: number }, session) => {
      const day = session.createdAt.split('T')[0]; // YYYY-MM-DD format
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const formattedHeatmapData = Object.keys(heatmapData).map(day => ({
      day,
      value: heatmapData[day],
    }));

    // 5. Calculate module distribution (for bar chart)
    const moduleCounts = sessions.reduce((acc: { [key: string]: number }, session) => {
      acc[session.moduleType] = (acc[session.moduleType] || 0) + 1;
      return acc;
    }, {});

    // 6. Calculate score trends (for line chart)
    const scoreTrends: { [key: string]: any }[] = [];
    const sessionsByDay = sessions.reduce((acc: { [key: string]: any[] }, session) => {
      const day = startOfDay(new Date(session.createdAt)).toISOString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    }, {});

    Object.keys(sessionsByDay).forEach(day => {
      const daySessions = sessionsByDay[day];
      const dailyAverages: { [key: string]: number } = {};
      const counts: { [key: string]: number } = {};

      daySessions.forEach(session => {
        if (session.scores) {
          Object.keys(session.scores).forEach(key => {
            dailyAverages[key] = (dailyAverages[key] || 0) + session.scores[key];
            counts[key] = (counts[key] || 0) + 1;
          });
        }
      });

      const trendPoint: { [key: string]: any } = { date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      Object.keys(dailyAverages).forEach(key => {
        trendPoint[key] = Math.round(dailyAverages[key] / counts[key]);
      });
      scoreTrends.push(trendPoint);
    });

    // 7. Analyze strengths/weaknesses
    const allScores: { [key: string]: number[] } = {};
    sessions.forEach(session => {
      if (session.scores) {
        Object.keys(session.scores).forEach(key => {
          if (key !== 'overall' && session.scores) {
            if (!allScores[key]) allScores[key] = [];
            allScores[key].push(session.scores[key]);
          }
        });
      }
    });

    let strongestArea = { name: 'N/A', score: 0 };
    let weakestArea = { name: 'N/A', score: 100 };
    Object.keys(allScores).forEach(key => {
      const avg = allScores[key].reduce((a, b) => a + b, 0) / allScores[key].length;
      if (avg > strongestArea.score) strongestArea = { name: key, score: Math.round(avg) };
      if (avg < weakestArea.score) weakestArea = { name: key, score: Math.round(avg) };
    });

    // 7b. Module-based strongest/weakest area
    const moduleAverages: { [key: string]: number[] } = {};
    sessions.forEach(session => {
      if (session.scores && typeof session.scores === 'object') {
        const vals = Object.values(session.scores) as number[];
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const m = session.moduleType;
        if (!moduleAverages[m]) moduleAverages[m] = [];
        moduleAverages[m].push(avg);
      }
    });
    let strongestModule = { name: 'N/A', score: 0 };
    let weakestModule = { name: 'N/A', score: 100 };
    Object.keys(moduleAverages).forEach(moduleName => {
      const avg = moduleAverages[moduleName].reduce((a, b) => a + b, 0) / moduleAverages[moduleName].length;
      const score = Math.round(avg);
      if (score > strongestModule.score) strongestModule = { name: moduleName, score };
      if (score < weakestModule.score) weakestModule = { name: moduleName, score };
    });

    // 8. Get recent activities (last 5 practices)
    const recentActivity = sessions.slice(-5).reverse().map(s => {
      let overallScore: number | null = null;
      if (s.scores && typeof s.scores === 'object') {
        if (typeof (s.scores as Record<string, unknown>).overall === 'number') {
          overallScore = Math.round((s.scores as Record<string, number>).overall);
        } else {
          const vals = Object.values(s.scores).filter((v): v is number => typeof v === 'number');
          overallScore = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
        }
      }
      return {
        module: s.moduleType,
        task_name: s.taskName || s.moduleType,
        date: new Date(s.createdAt).toLocaleString(),
        score: overallScore,
        ai_feedback: s.aiFeedback || '',
      };
    });

    // --- COMBINE RESULTS ---
    const dashboardData = {
      totalSessions,
      firstPracticeDate,
      heatmapData: formattedHeatmapData,
      moduleCounts,
      scoreTrends,
      analysis: { strongestArea, weakestArea },
      moduleAnalysis: { strongestModule, weakestModule },
      recentActivity
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
