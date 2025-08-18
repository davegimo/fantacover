import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cognome = searchParams.get('cognome');
  const squadra = searchParams.get('squadra');

  if (!cognome || !squadra) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  try {
    const giocatoriPath = path.join(process.cwd(), 'public', 'giocatori2', squadra);
    
    // Controlla se la cartella della squadra esiste
    try {
      await fs.access(giocatoriPath);
    } catch {
      return NextResponse.json({ exists: false, imagePath: null });
    }

    // Lista delle estensioni possibili
    const extensions = ['.webp', '.png', '.jpg', '.jpeg'];
    
    for (const ext of extensions) {
      const imagePath = path.join(giocatoriPath, `${cognome}${ext}`);
      try {
        await fs.access(imagePath);
        // Se il file esiste, restituisci il percorso relativo
        return NextResponse.json({ 
          exists: true, 
          imagePath: `/giocatori2/${squadra}/${cognome}${ext}` 
        });
      } catch {
        // Continua con la prossima estensione
      }
    }

    // Nessun file trovato
    return NextResponse.json({ exists: false, imagePath: null });
    
  } catch (error) {
    console.error('Errore nel controllare l\'immagine:', error);
    return NextResponse.json({ 
      error: 'Errore nel controllare l\'immagine' 
    }, { status: 500 });
  }
} 