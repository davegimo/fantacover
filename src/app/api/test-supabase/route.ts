import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    // Test della connessione
    const { data, error } = await supabase
      .from('user_visits')
      .select('user_id');

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Errore nella connessione a Supabase',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connessione a Supabase riuscita',
      tableExists: true,
      recordCount: data?.length || 0,
      visitors: data?.map(v => v.user_id) || []
    });

  } catch (error) {
    console.error('Errore nel test Supabase:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
