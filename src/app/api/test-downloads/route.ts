import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Variabili d\'ambiente Supabase non configurate',
        supabaseUrl: supabaseUrl ? 'Configurato' : 'Mancante',
        supabaseKey: supabaseServiceKey ? 'Configurato' : 'Mancante'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test della connessione alla tabella downloads_tracking
    const { data: downloadsData, error: downloadsError } = await supabase
      .from('downloads_tracking')
      .select('*', { count: 'exact', head: true });

    if (downloadsError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nella connessione alla tabella downloads_tracking',
        details: downloadsError.message
      }, { status: 500 });
    }

    // Test della connessione alla tabella downloads_stats
    const { data: statsData, error: statsError } = await supabase
      .from('downloads_stats')
      .select('*', { count: 'exact', head: true });

    if (statsError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nella connessione alla tabella downloads_stats',
        details: statsError.message
      }, { status: 500 });
    }

    // Test inserimento di un record di esempio
    const testRecord = {
      user_id: 'test_user_' + Date.now(),
      session_id: 'test_session_' + Date.now(),
      device_type: 'desktop',
      action_type: 'download',
      file_format: 'png',
      file_size: 1024,
      image_dimensions: '1920x1080',
      user_agent: 'Test User Agent',
      ip_address: '127.0.0.1',
      referrer: 'https://test.com',
      url_path: '/test',
      share_platform: null,
      share_method: null,
      metadata: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
    };

    const { data: insertData, error: insertError } = await supabase
      .from('downloads_tracking')
      .insert(testRecord)
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nell\'inserimento di test nella tabella downloads_tracking',
        details: insertError.message
      }, { status: 500 });
    }

    // Elimina il record di test
    if (insertData && insertData[0]) {
      await supabase
        .from('downloads_tracking')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      success: true,
      message: 'Test downloads_tracking completato con successo',
      tables: {
        downloads_tracking: {
          exists: true,
          recordCount: downloadsData?.length || 0
        },
        downloads_stats: {
          exists: true,
          recordCount: statsData?.length || 0
        }
      },
      testInsert: {
        success: true,
        recordId: insertData?.[0]?.id
      }
    });

  } catch (error) {
    console.error('Errore nel test downloads_tracking:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
