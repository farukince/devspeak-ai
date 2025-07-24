import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Kullanıcıyı doğrula
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Kullanıcının tüm pratiklerini veritabanından çek
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('created_at, module_type, scores')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No practice sessions found.' });
    }

    // --- VERİ İŞLEME BÖLÜMÜ ---

    // 3. Genel İstatistikleri Hesapla
    const totalSessions = sessions.length;
    const firstPracticeDate = sessions[0].created_at;

    // 4. Aktivite Takvimi (Heatmap) için veriyi hazırla
    const heatmapData = sessions.reduce((acc: { [key: string]: number }, session) => {
      const day = session.created_at.split('T')[0]; // YYYY-MM-DD formatında
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const formattedHeatmapData = Object.keys(heatmapData).map(day => ({
      day,
      value: heatmapData[day],
    }));

    // 5. Modül Dağılımını Hesapla (Bar Chart için)
    const moduleCounts = sessions.reduce((acc: { [key: string]: number }, session) => {
      acc[session.module_type] = (acc[session.module_type] || 0) + 1;
      return acc;
    }, {});

    // 6. Skor Gelişimini Hesapla (Line Chart için)
    const scoreTrends: { [key: string]: any }[] = [];
    const sessionsByDay = sessions.reduce((acc: { [key: string]: any[] }, session) => {
      const day = startOfDay(new Date(session.created_at)).toISOString();
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

    // 7. Güçlü/Zayıf Yön Analizi için veriyi hazırla
    const allScores: { [key: string]: number[] } = {};
    sessions.forEach(session => {
      if (session.scores) {
        Object.keys(session.scores).forEach(key => {
          if (key !== 'overall') { // Genel skoru analize katmayalım
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

    // 8. Son Aktiviteleri al (son 5 pratik)
    const recentActivity = sessions.slice(-5).reverse().map(s => ({
      module: s.module_type,
      date: new Date(s.created_at).toLocaleString(),
    }));

    // --- SONUÇLARI BİRLEŞTİR ---
    const dashboardData = {
      totalSessions,
      firstPracticeDate,
      heatmapData: formattedHeatmapData,
      moduleCounts,
      scoreTrends,
      analysis: { strongestArea, weakestArea },
      recentActivity
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}