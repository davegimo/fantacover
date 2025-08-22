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
      urlDomain, 
      fullUrl, 
      userAgent, 
      referrer, 
      screenResolution, 
      timezone, 
      language 
    } = body;

    // Validazione dei dati richiesti
    if (!userId || !urlDomain) {
      return NextResponse.json(
        { error: 'userId e urlDomain sono richiesti' },
        { status: 400 }
      );
    }

    // Controlla se l'utente esiste già
    const { data: existingUser, error: checkError } = await supabase
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Errore nel controllare utente esistente:', checkError);
      return NextResponse.json(
        { error: 'Errore nel controllare utente esistente' },
        { status: 500 }
      );
    }

    if (existingUser) {
      // Utente esistente: aggiorna last_visit_at e incrementa visit_count
      const { error: updateError } = await supabase
        .from('user_visits')
        .update({
          last_visit_at: new Date().toISOString(),
          visit_count: existingUser.visit_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Errore nell\'aggiornare visita utente:', updateError);
        return NextResponse.json(
          { error: 'Errore nell\'aggiornare visita utente' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Visita utente aggiornata',
        isNewUser: false 
      });
    } else {
      // Nuovo utente: inserisci nuovo record
      const { error: insertError } = await supabase
        .from('user_visits')
        .insert({
          user_id: userId,
          url_domain: urlDomain,
          full_url: fullUrl,
          user_agent: userAgent,
          referrer: referrer,
          screen_resolution: screenResolution,
          timezone: timezone,
          language: language
        });

      if (insertError) {
        console.error('Errore nell\'inserire nuovo utente:', insertError);
        return NextResponse.json(
          { error: 'Errore nell\'inserire nuovo utente' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Nuovo utente registrato',
        isNewUser: true 
      });
    }
  } catch (error) {
    console.error('Errore generale nell\'API user-visit:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
