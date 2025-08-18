import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const squadra = searchParams.get('squadra');

  if (!squadra) {
    return NextResponse.json({ error: 'Squadra non specificata' }, { status: 400 });
  }

  try {
    const giocatoriPath = path.join(process.cwd(), 'public', 'giocatori2', squadra);
    const files = await fs.readdir(giocatoriPath);
    
    // Filtra i file .webp e .png e rimuovi l'estensione
    const giocatori = files
      .filter(file => file.endsWith('.webp') || file.endsWith('.png'))
      .map(file => file.replace(/\.(webp|png)$/, ''))
      .filter((nome, index, array) => array.indexOf(nome) === index); // Rimuovi duplicati

    return NextResponse.json(giocatori);
  } catch (error) {
    console.error('Errore nel leggere la cartella giocatori:', error);
    return NextResponse.json({ error: 'Squadra non trovata' }, { status: 404 });
  }
} 