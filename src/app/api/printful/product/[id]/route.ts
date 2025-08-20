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
    const response = await printfulApi.get(`/store/products/${productId}`);
    
    if (response.data?.result) {
      const product = response.data.result;
      
      // Mappa le varianti con informazioni essenziali
      const variants = product.sync_variants?.map((variant: { 
        id: number; 
        name: string; 
        size: string; 
        color: string; 
        retail_price: string; 
        currency: string; 
        availability_status: string;
        product: { product_id: number; variant_id: number };
      }) => ({
        id: variant.id,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        price: variant.retail_price,
        currency: variant.currency,
        in_stock: variant.availability_status !== 'out_of_stock',
        catalog_product_id: variant.product?.product_id,
        catalog_variant_id: variant.product?.variant_id
      })) || [];
      
      return NextResponse.json({
        success: true,
        product: {
          id: product.sync_product?.id,
          name: product.sync_product?.name,
          thumbnail_url: product.sync_product?.thumbnail_url,
          variants: variants
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Prodotto non trovato'
      }, { status: 404 });
    }
    
  } catch (error: unknown) {
    console.error('Errore nel recupero del prodotto:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Errore nel recupero del prodotto',
      details: (error as { response?: { data?: unknown } })?.response?.data || error
    }, { status: 500 });
  }
}
