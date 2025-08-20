import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

if (!PRINTFUL_API_KEY) {
  console.warn('PRINTFUL_API_KEY non configurata nelle variabili d\'ambiente');
}

// Configurazione axios per Printful
const printfulApi = axios.create({
  baseURL: PRINTFUL_API_URL,
  headers: {
    'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function GET() {
  try {
    if (!PRINTFUL_API_KEY) {
      return NextResponse.json(
        { error: 'API Key Printful non configurata' },
        { status: 500 }
      );
    }

    // Recupera tutti i prodotti dal negozio Printful
    const response = await printfulApi.get('/store/products');
    
    if (response.data && response.data.result) {
      // Per ogni prodotto, recupera anche i dettagli delle varianti
      const prodottiConVarianti = await Promise.all(
        response.data.result
          .filter((prodotto: any) => !prodotto.is_ignored)
          .map(async (prodotto: any) => {
            try {
              // Recupera i dettagli del prodotto per avere le varianti complete
              const dettagliResponse = await printfulApi.get(`/store/products/${prodotto.id}`);
              const dettagli = dettagliResponse.data?.result;
              
              return {
                id: prodotto.id,
                nome: prodotto.name,
                tipo: prodotto.type,
                thumbnail_url: prodotto.thumbnail_url,
                is_ignored: prodotto.is_ignored,
                sync_variants: dettagli?.sync_variants?.map((variant: any) => ({
                  id: variant.id,
                  name: variant.name,
                  size: variant.size,
                  color: variant.color,
                  price: variant.retail_price,
                  currency: variant.currency,
                  in_stock: variant.availability_status !== 'out_of_stock'
                })) || []
              };
            } catch (error) {
              console.error(`Errore nel recupero dettagli prodotto ${prodotto.id}:`, error);
              // Fallback: restituisci il prodotto base senza varianti
              return {
                id: prodotto.id,
                nome: prodotto.name,
                tipo: prodotto.type,
                thumbnail_url: prodotto.thumbnail_url,
                is_ignored: prodotto.is_ignored,
                sync_variants: []
              };
            }
          })
      );

      return NextResponse.json({ 
        success: true, 
        prodotti: prodottiConVarianti
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Nessun prodotto trovato' 
    }, { status: 404 });

  } catch (error: any) {
    console.error('Errore nel recupero prodotti Printful:', error.response?.data || error.message);
    
    return NextResponse.json({
      success: false,
      error: 'Errore nel recupero dei prodotti',
      details: error.response?.data?.error || error.message
    }, { status: 500 });
  }
}
