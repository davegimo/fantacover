import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';

export interface GiocatoreExcel {
  ruolo: string;
  cognome: string;
  squadra: string;
}

export async function GET() {
  try {
    // Percorso del file Excel
    const filePath = path.join(process.cwd(), 'public', 'Quotazioni_Fantacalcio_Stagione_2025_26.xlsx');
    
    // Leggi il file
    const fileBuffer = await fs.readFile(filePath);
    
    // Analizza il file Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Prendi il primo foglio
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Converti in JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Estrai i dati rilevanti (salta la prima riga se è header)
    const giocatori: GiocatoreExcel[] = [];
    
    // Inizia dalla riga 1 (indice 1) per saltare l'header
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as (string | number)[];
      
      // Verifica che la riga abbia abbastanza colonne
      if (row && row.length >= 5) {
        const ruolo = row[1]; // Colonna B (indice 1)
        const cognome = row[3]; // Colonna D (indice 3)
        const squadra = row[4]; // Colonna E (indice 4)
        
        // Verifica che i dati non siano vuoti
        if (ruolo && cognome && squadra) {
          giocatori.push({
            ruolo: ruolo.toString().trim(),
            cognome: cognome.toString().trim(),
            squadra: squadra.toString().trim()
          });
        }
      }
    }
    
    return NextResponse.json(giocatori);
  } catch (error) {
    console.error('Errore nel leggere il file Excel:', error);
    return NextResponse.json(
      { error: 'Errore nel leggere il file Excel' }, 
      { status: 500 }
    );
  }
} 