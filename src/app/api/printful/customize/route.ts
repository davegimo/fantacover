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

export async function POST(request: NextRequest) {
  console.log('🚀 API customize chiamata - Inizio elaborazione');
  
  try {
    console.log('🔑 Verifica API Key...');
    if (!PRINTFUL_API_KEY) {
      console.error('❌ API Key Printful non configurata');
      return NextResponse.json(
        { error: 'API Key Printful non configurata' },
        { status: 500 }
      );
    }
    console.log('✅ API Key trovata');

    console.log('📥 Parsing del body della richiesta...');
    const body = await request.json();
    console.log('📋 Body ricevuto:', {
      hasProductId: !!body.productId,
      hasVariantId: !!body.variantId,
      hasImageBase64: !!body.imageBase64,
      imageLength: body.imageBase64 ? body.imageBase64.length : 0,
      hasPositionOptions: !!body.positionOptions
    });
    
    const { productId, variantId, imageBase64, positionOptions } = body;

    if (!productId || !variantId || !imageBase64) {
      console.error('❌ Dati mancanti:', { productId, variantId, hasImage: !!imageBase64 });
      return NextResponse.json(
        { error: 'Dati mancanti: productId, variantId e imageBase64 sono richiesti' },
        { status: 400 }
      );
    }
    console.log('✅ Dati validati');

    // Prima, carica l'immagine su Printful
    let uploadData;
    
    console.log('Tipo di immagine ricevuta:', {
      isDataUrl: imageBase64.startsWith('data:'),
      length: imageBase64.length,
      prefix: imageBase64.substring(0, 50)
    });
    
    if (imageBase64.startsWith('data:')) {
      // Se è un data URL, estrarre solo il contenuto base64
      const base64Content = imageBase64.split(',')[1];
      if (!base64Content) {
        throw new Error('Formato data URL non valido');
      }
      uploadData = {
        type: 'default',
        data: base64Content,  // CORRETTO: da 'contents' a 'data'
        filename: `fantacover-${Date.now()}.png`
      };
    } else {
      // Se è già un contenuto base64 puro (senza data: prefix)
      uploadData = {
        type: 'default',
        data: imageBase64,  // CORRETTO: da 'contents' a 'data'
        filename: `fantacover-${Date.now()}.png`
      };
    }
    
    console.log('Caricamento file su Printful con dati:', { 
      type: uploadData.type, 
      filename: uploadData.filename,
      hasData: !!uploadData.data,  // CORRETTO: da 'hasContents' a 'hasData'
      contentLength: uploadData.data ? uploadData.data.length : 0  // CORRETTO: da 'contents' a 'data'
    });
    
    const uploadResponse = await printfulApi.post('/files', uploadData);
    
    console.log('Risposta upload file:', {
      status: uploadResponse.status,
      hasResult: !!uploadResponse.data?.result,
      resultId: uploadResponse.data?.result?.id,
      fullResponse: uploadResponse.data
    });

    if (!uploadResponse.data?.result?.id) {
      console.error('Errore nell\'upload del file:', uploadResponse.data);
      throw new Error('Errore nel caricamento dell\'immagine: ' + (uploadResponse.data?.error || 'Risposta non valida'));
    }

    const fileId = uploadResponse.data.result.id;
    console.log('File caricato con successo, ID:', fileId);

    // Otteniamo i dettagli del prodotto per trovare il template_id corretto
    console.log('Recupero dettagli prodotto per template_id...');
    const productResponse = await printfulApi.get(`/store/products/${productId}`);
    console.log('Dettagli prodotto completi:', JSON.stringify(productResponse.data?.result, null, 2));
    
    // Proviamo a trovare il template_id da diverse posizioni
    const product = productResponse.data?.result;
    
    // Il product_id corretto è quello del catalogo Printful, non del sync_product
    const catalogProductId = product?.sync_variants?.[0]?.product?.product_id;
    
    const possibleTemplateIds = [
      catalogProductId,  // ID del catalogo Printful (es: 19 per le tazze)
      product?.sync_product?.id,
      product?.sync_product?.external_id,
      productId  // fallback
    ];
    console.log('Possibili template IDs:', possibleTemplateIds);
    console.log('Catalog Product ID trovato:', catalogProductId);

    // Per le tazze, usiamo i catalog_variant_ids invece di variant_ids
    // e una struttura più semplice
    const selectedVariant = product.sync_variants.find((v: any) => v.id === parseInt(variantId));
    const catalogVariantId = selectedVariant?.variant_id;
    
    console.log('Variant mapping:', {
      syncVariantId: variantId,
      catalogVariantId: catalogVariantId,
      productId: catalogProductId
    });
    
    // IMPLEMENTIAMO IL MOCKUP GENERATOR V1 CON PLACEMENT AUTOMATICO
    console.log('✅ File caricato con successo su Printful!');
    console.log('📋 Dettagli file:', {
      fileId: fileId,
      catalogProductId: catalogProductId,
      catalogVariantId: catalogVariantId,
      syncVariantId: variantId,
      previewUrl: uploadResponse.data?.result?.preview_url
    });
    
    // Avviamo il mockup generator V1
    console.log('🎨 Avvio mockup generator V1...');
    
    try {
      
      // Prima otteniamo i placement disponibili per questo prodotto
      console.log('🔍 Recupero placement disponibili per il prodotto...');
      const catalogProductResponse = await printfulApi.get(`/products/${catalogProductId}`);
      
      // Log completo per debug
      console.log('📋 Risposta completa prodotto catalogo:', JSON.stringify(catalogProductResponse.data, null, 2));
      
      // Estrai i placement disponibili dalla struttura corretta
      let availablePlacements = [];
      
      // La struttura corretta è result.product.files
      if (catalogProductResponse.data?.result?.product?.files) {
        availablePlacements = catalogProductResponse.data.result.product.files.map((f: any) => f.id);
        console.log('✅ Placement trovati in result.product.files:', availablePlacements);
      } else if (catalogProductResponse.data?.result?.files) {
        availablePlacements = Object.keys(catalogProductResponse.data.result.files);
        console.log('✅ Placement trovati in result.files:', availablePlacements);
      }
      
      console.log('🎯 Placement disponibili trovati:', availablePlacements);
      
      // Per le tazze, usa sempre 'default' invece di quello richiesto
      const correctPlacement = 'default'; // Forziamo 'default' per le tazze
      
      console.log('🎯 Placement da usare:', {
        richiesto: positionOptions?.placement,
        disponibili: availablePlacements,
        selezionato: correctPlacement
      });
      
      // Creiamo il formato corretto con il placement giusto
      const mockupV1Data = {
        variant_ids: [catalogVariantId],
        format: 'jpg',
        files: [
          {
            id: fileId,
            type: 'default'
            // Rimuoviamo placement per ora per testare
          }
        ]
      };
      
      console.log('🎨 Dati mockup con placement corretto:', JSON.stringify(mockupV1Data, null, 2));
      
      // Una singola chiamata con il placement corretto
      let mockupV1Response;
      try {
        console.log(`📡 Tentativo con product_id: ${catalogProductId}`);
        mockupV1Response = await printfulApi.post(`/mockup-generator/create-task/${catalogProductId}`, mockupV1Data);
        console.log(`✅ Successo con placement ${correctPlacement}!`);
      } catch (v1Error: any) {
        if (v1Error.response?.status === 404) {
          console.log('📡 Product_id non trovato, provo con endpoint generico /0');
          mockupV1Response = await printfulApi.post('/mockup-generator/create-task/0', mockupV1Data);
          console.log(`✅ Successo con endpoint /0 e placement ${correctPlacement}!`);
        } else {
          throw v1Error;
        }
      }
      
      console.log('📸 Risposta mockup V1:', {
        status: mockupV1Response.status,
        hasResult: !!mockupV1Response.data?.result,
        taskKey: mockupV1Response.data?.result?.task_key,
        fullResponse: mockupV1Response.data
      });
      
      if (mockupV1Response.data?.result?.task_key) {
        const taskKey = mockupV1Response.data.result.task_key;
        
        // Polling per attendere il completamento
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondi
          
          console.log(`🔄 Polling tentativo ${attempts + 1}/${maxAttempts}...`);
          const resultResponse = await printfulApi.get(`/mockup-generator/task?task_key=${taskKey}`);
          
          console.log('📊 Status task:', {
            status: resultResponse.data?.result?.status,
            progress: resultResponse.data?.result?.progress,
            hasMockups: !!resultResponse.data?.result?.mockups
          });
          
          if (resultResponse.data?.result?.status === 'completed') {
            const results = resultResponse.data.result.mockups || []; // V1 usa 'mockups' invece di 'results'
            
            console.log('🎉 Mockup V1 completato!', {
              numResults: results.length,
              results: results.map((r: any) => ({ mockup_url: r.mockup_url, variant_id: r.variant_id }))
            });
            
            return NextResponse.json({
              success: true,
              fileId: fileId,
              catalogProductId: catalogProductId,
              catalogVariantId: catalogVariantId,
              syncVariantId: variantId,
              message: 'Immagine caricata e mockup generato con successo!',
              mockups: results.map((result: any) => ({
                placement: result.placement || 'front',
                mockup_url: result.mockup_url,
                variant_id: result.variant_id
              })),
              previewUrl: uploadResponse.data?.result?.preview_url,
              thumbnailUrl: uploadResponse.data?.result?.thumbnail_url
            });
          }
          
          if (resultResponse.data?.result?.status === 'failed') {
            console.error('❌ Mockup V1 fallito:', resultResponse.data?.result?.error);
            break;
          }
          
          attempts++;
        }
        
        // Timeout - restituiamo comunque il file ID
        console.log('⏰ Timeout mockup V1, restituisco file ID');
        return NextResponse.json({
          success: true,
          fileId: fileId,
          catalogProductId: catalogProductId,
          catalogVariantId: catalogVariantId,
          syncVariantId: variantId,
          message: 'Immagine caricata con successo! Mockup in elaborazione...',
          mockups: [],
          previewUrl: uploadResponse.data?.result?.preview_url,
          thumbnailUrl: uploadResponse.data?.result?.thumbnail_url,
          taskKey: taskKey // Per controllare lo stato dopo
        });
      }
      
    } catch (mockupError: any) {
      console.error('❌ Errore mockup V1:', mockupError.response?.data || mockupError.message);
      
      // Se il mockup fallisce, restituiamo comunque il file ID
      return NextResponse.json({
        success: true,
        fileId: fileId,
        catalogProductId: catalogProductId,
        catalogVariantId: catalogVariantId,
        syncVariantId: variantId,
        message: 'Immagine caricata con successo! Mockup generator temporaneamente non disponibile.',
        mockups: [],
        previewUrl: uploadResponse.data?.result?.preview_url,
        thumbnailUrl: uploadResponse.data?.result?.thumbnail_url,
        mockupError: mockupError.response?.data?.error || mockupError.message
      });
    }

  } catch (error: any) {
    console.error('Errore nella personalizzazione:', error.response?.data || error.message);
    
    return NextResponse.json({
      success: false,
      error: 'Errore nella personalizzazione del prodotto',
      details: error.response?.data?.error || error.message
    }, { status: 500 });
  }
}
