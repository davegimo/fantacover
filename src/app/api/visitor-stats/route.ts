import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
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

    // Conta visitatori univoci dalla tabella user_visits
    const { data: visitorsData, error: visitorsError } = await supabase
      .from('user_visits')
      .select('user_id');

    if (visitorsError) {
      console.error('Errore nel recuperare visitatori:', visitorsError);
      // Non blocchiamo l'API se questa tabella non esiste
    }

    // Conta download e condivisioni dalla tabella downloads_tracking
    const { data: downloadsData, error: downloadsError } = await supabase
      .from('downloads_tracking')
      .select('action_type');

    if (downloadsError) {
      console.error('Errore nel recuperare download:', downloadsError);
      // Non blocchiamo l'API se questa tabella non esiste
    }

    // Calcola le statistiche
    const baseVisitors = 1200;
    const baseShares = 300;
    
    const uniqueVisitors = baseVisitors + (visitorsData?.length || 0);
    
    let totalShares = baseShares;
    if (downloadsData) {
      downloadsData.forEach(record => {
        if (record.action_type === 'download' || record.action_type.startsWith('share_')) {
          totalShares++;
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        uniqueVisitors,
        totalShares,
        baseVisitors,
        baseShares,
        newVisitors: visitorsData?.length || 0,
        newShares: downloadsData?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore nel recuperare statistiche visitatori:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
