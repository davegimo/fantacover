import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    if (!PRINTFUL_API_KEY) {
      return NextResponse.json(
        { error: 'API Key Printful non configurata' },
        { status: 500 }
      );
    }

    const response = await printfulApi.get('/store/products');
    
    if (response.data?.result) {
      const products = response.data.result.map((product: { sync_product: { id: number; name: string; thumbnail_url: string } }) => ({
        id: product.sync_product.id,
        name: product.sync_product.name,
        thumbnail: product.sync_product.thumbnail_url
      }));
      
      return NextResponse.json({
        success: true,
        products: products
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Nessun prodotto trovato'
      });
    }
    
  } catch (error: unknown) {
    console.error('Errore nel recupero dei prodotti:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Errore nel recupero dei prodotti',
      details: (error as { response?: { data?: unknown } })?.response?.data || error
    }, { status: 500 });
  }
}
