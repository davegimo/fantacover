import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inizializza il client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verifica che le variabili d'ambiente siano configurate
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variabili d\'ambiente Supabase non configurate');
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Verifica che Supabase sia configurato
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      userId,
      sessionId,
      actionType, // 'download', 'share_whatsapp', 'share_instagram', etc.
      fileFormat,
      fileSize,
      imageDimensions,
      sharePlatform,
      shareMethod,
      metadata
    } = body;

    // Validazione dei dati richiesti
    if (!userId || !actionType) {
      return NextResponse.json(
        { error: 'userId e actionType sono richiesti' },
        { status: 400 }
      );
    }

    // Determina il tipo di dispositivo dall'User-Agent
    const userAgent = request.headers.get('user-agent') || '';
    let deviceType = 'desktop';
    
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    // Ottieni l'IP dell'utente
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Ottieni il referrer
    const referrer = request.headers.get('referer') || null;

    // Ottieni il path dell'URL
    const url = new URL(request.url);
    const urlPath = url.pathname;

    // Prepara i dati per l'inserimento
    const downloadData = {
      user_id: userId,
      session_id: sessionId,
      device_type: deviceType,
      action_type: actionType,
      file_format: fileFormat,
      file_size: fileSize,
      image_dimensions: imageDimensions,
      user_agent: userAgent,
      ip_address: ip,
      referrer: referrer,
      url_path: urlPath,
      share_platform: sharePlatform,
      share_method: shareMethod,
      metadata: metadata
    };

    // Inserisci il record
    const { error: insertError } = await supabase
      .from('downloads_tracking')
      .insert(downloadData);

    if (insertError) {
      console.error('Errore nell\'inserire download tracking:', insertError);
      return NextResponse.json(
        { error: 'Errore nell\'inserire tracking download' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Download tracking registrato con successo',
      deviceType,
      actionType
    });

  } catch (error) {
    console.error('Errore generale nell\'API download-tracking:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Endpoint per ottenere statistiche (solo per admin)
export async function GET(request: NextRequest) {
  try {
    // Verifica che Supabase sia configurato
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const actionType = url.searchParams.get('actionType');

    let query = supabase
      .from('downloads_tracking')
      .select('*');

    if (date) {
      query = query.gte('download_timestamp', `${date}T00:00:00Z`)
                   .lt('download_timestamp', `${date}T23:59:59Z`);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data, error } = await query.order('download_timestamp', { ascending: false });

    if (error) {
      console.error('Errore nel recuperare statistiche download:', error);
      return NextResponse.json(
        { error: 'Errore nel recuperare statistiche' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Errore generale nell\'API download-tracking GET:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
