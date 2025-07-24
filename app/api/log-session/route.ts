import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Kullanıcının kimliğini doğrula
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Frontend'den gönderilen verileri al
    const sessionData = await request.json();
    const { module_type, task_name, scores, user_input, ai_feedback } = sessionData;

    if (!module_type || !user_input || !ai_feedback) {
      return NextResponse.json({ error: 'Missing required session data.' }, { status: 400 });
    }

    // 3. Veritabanına kaydedilecek nesneyi oluştur
    const dataToInsert = {
      user_id: user.id, // Güvenli bir şekilde sunucudan aldık
      module_type,
      task_name: task_name || null,
      scores: scores || null,
      user_input,
      ai_feedback,
    };

    // 4. Supabase'e veriyi ekle
    const { error } = await supabase
      .from('practice_sessions')
      .insert(dataToInsert);

    if (error) {
      console.error('Supabase insert error:', error);
      throw error; // Hata fırlat ve aşağıdaki catch bloğunda yakala
    }

    // 5. Başarılı yanıtı döndür
    return NextResponse.json({ message: 'Session logged successfully' }, { status: 201 });

  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}