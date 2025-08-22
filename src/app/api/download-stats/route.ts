import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Variabili d\'ambiente Supabase non configurate'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Statistiche generali
    const { data: totalData, error: totalError } = await supabase
      .from('downloads_tracking')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nel recuperare statistiche totali',
        details: totalError.message
      }, { status: 500 });
    }

    // Download per tipo di azione
    const { data: actionStats, error: actionError } = await supabase
      .from('downloads_tracking')
      .select('action_type, device_type')
      .order('created_at', { ascending: false });

    if (actionError) {
      return NextResponse.json({
        success: false,
        error: 'Errore nel recuperare statistiche per azione',
        details: actionError.message
      }, { status: 500 });
    }

    // Calcola statistiche
    const stats = {
      total: totalData?.length || 0,
      downloads: 0,
      shares: 0,
      byDevice: {
        desktop: 0,
        mobile: 0,
        tablet: 0
      },
      byAction: {},
      recentActivity: []
    };

    // Analizza i dati
    actionStats?.forEach(record => {
      if (record.action_type === 'download') {
        stats.downloads++;
      } else if (record.action_type.startsWith('share_')) {
        stats.shares++;
      }

      // Conta per dispositivo
      if (record.device_type) {
        stats.byDevice[record.device_type as keyof typeof stats.byDevice]++;
      }

      // Conta per azione
      const action = record.action_type;
      stats.byAction[action] = (stats.byAction[action] || 0) + 1;
    });

    // Recupera attività recente (ultimi 10 record)
    const { data: recentData, error: recentError } = await supabase
      .from('downloads_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentError && recentData) {
      stats.recentActivity = recentData.map(record => ({
        id: record.id,
        user_id: record.user_id,
        action_type: record.action_type,
        device_type: record.device_type,
        file_format: record.file_format,
        image_dimensions: record.image_dimensions,
        created_at: record.created_at,
        metadata: record.metadata
      }));
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore nel recuperare statistiche:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
