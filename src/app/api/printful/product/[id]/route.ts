import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

const printfulApi = axios.create({
  baseURL: PRINTFUL_API_URL,
  headers: {
    'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!PRINTFUL_API_KEY) {
      return NextResponse.json(
        { error: 'API Key Printful non configurata' },
        { status: 500 }
      );
    }

    const { id: productId } = await params;

    // Recupera i dettagli del prodotto specifico
    const response = await printfulApi.get(`/store/products/${productId}`);
    
    if (response.data && response.data.result) {
      const prodotto = response.data.result;
      
      // Formatta i dati del prodotto per il frontend
      const prodottoFormattato = {
        id: prodotto.id,
        nome: prodotto.name,
        tipo: prodotto.type,
        thumbnail_url: prodotto.thumbnail_url,
        is_ignored: prodotto.is_ignored,
        sync_variants: prodotto.sync_variants?.map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          size: variant.size,
          color: variant.color,
          color_code: variant.color_code,
          image: variant.files?.find((file: any) => file.type === 'preview')?.preview_url || variant.product?.image,
          price: variant.retail_price,
          currency: variant.currency,
          in_stock: variant.availability_status !== 'out_of_stock'
        })) || []
      };

      return NextResponse.json({ 
        success: true, 
        prodotto: prodottoFormattato
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Prodotto non trovato' 
    }, { status: 404 });

  } catch (error: any) {
    console.error('Errore nel recupero dettagli prodotto:', error.response?.data || error.message);
    
    return NextResponse.json({
      success: false,
      error: 'Errore nel recupero dei dettagli del prodotto',
      details: error.response?.data?.error || error.message
    }, { status: 500 });
  }
}
