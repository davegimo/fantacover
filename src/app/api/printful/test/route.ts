import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

export async function GET() {
  console.log('🧪 Test API Printful chiamata');
  
  try {
    if (!PRINTFUL_API_KEY) {
      console.error('❌ API Key non trovata');
      return NextResponse.json({ error: 'API Key non configurata' }, { status: 500 });
    }
    
    console.log('✅ API Key trovata');
    
    const response = await axios.get('https://api.printful.com/store', {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Connessione Printful OK');
    return NextResponse.json({ 
      success: true, 
      message: 'Connessione Printful funzionante',
      store: response.data?.result
    });
    
  } catch (error: any) {
    console.error('❌ Errore test Printful:', error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      error: 'Errore connessione Printful',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}
