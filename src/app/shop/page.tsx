'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Leckerli_One } from 'next/font/google';

const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});

interface ProdottoPrintful {
  id: number;
  nome: string;
  tipo: string;
  thumbnail_url: string;
  sync_variants: any[];
}

interface VarianteProdotto {
  id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  image: string;
  price: string;
  currency: string;
  in_stock: boolean;
}

export default function ShopPage() {
  const [prodotti, setProdotti] = useState<ProdottoPrintful[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prodottoSelezionato, setProdottoSelezionato] = useState<ProdottoPrintful | null>(null);
  const [variantiProdotto, setVariantiProdotto] = useState<VarianteProdotto[]>([]);
  const [loadingVarianti, setLoadingVarianti] = useState(false);

  // Carica i prodotti dal negozio Printful
  useEffect(() => {
    const caricaProdotti = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/printful/products');
        const data = await response.json();

        if (data.success) {
          setProdotti(data.prodotti);
          setError(null);
        } else {
          setError(data.error || 'Errore nel caricamento dei prodotti');
        }
      } catch (err) {
        console.error('Errore nel caricamento prodotti:', err);
        setError('Errore di connessione al negozio');
      } finally {
        setLoading(false);
      }
    };

    caricaProdotti();
  }, []);

  // Carica le varianti di un prodotto specifico
  const caricaVariantiProdotto = async (prodotto: ProdottoPrintful) => {
    try {
      setLoadingVarianti(true);
      setProdottoSelezionato(prodotto);
      
      const response = await fetch(`/api/printful/product/${prodotto.id}`);
      const data = await response.json();

      if (data.success) {
        setVariantiProdotto(data.prodotto.sync_variants);
      } else {
        setError(data.error || 'Errore nel caricamento delle varianti');
      }
    } catch (err) {
      console.error('Errore nel caricamento varianti:', err);
      setError('Errore nel caricamento delle varianti del prodotto');
    } finally {
      setLoadingVarianti(false);
    }
  };

  const chiudiDettagliProdotto = () => {
    setProdottoSelezionato(null);
    setVariantiProdotto([]);
  };

  // Funzione per ottenere il prezzo più basso del prodotto
  const getPrezzoMinimo = (variants: any[]) => {
    if (!variants || variants.length === 0) return null;
    // Cerca sia retail_price che price per compatibilità
    const prezzi = variants.map(v => parseFloat(v.retail_price || v.price || '0')).filter(p => p > 0);
    return prezzi.length > 0 ? Math.min(...prezzi) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Caricamento negozio...</h3>
          <p className="text-gray-600 text-center">Recupero i prodotti dal tuo negozio Printful</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Errore di caricamento</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-4 text-white hover:text-blue-200 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-lg font-semibold">Torna al Creatore</span>
          </Link>
          
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-white transform -rotate-2 ${leckerliOne.className}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            FantaCover Shop
          </h1>
          
          <div className="w-32"></div> {/* Spacer per centrare il titolo */}
        </div>

        {/* Descrizione */}
        <div className="text-center mb-12">
          <p className="text-white text-lg mb-4">
            Personalizza i tuoi prodotti con la tua rosa di fantacalcio!
          </p>
          <p className="text-blue-200 text-sm">
            Scegli un prodotto, applica la tua formazione e procedi all'acquisto
          </p>
        </div>

        {/* Modal dettagli prodotto */}
        {prodottoSelezionato && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={chiudiDettagliProdotto}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {prodottoSelezionato.nome}
                </h3>
                <button
                  onClick={chiudiDettagliProdotto}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {loadingVarianti ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mr-3"></div>
                  <span className="text-gray-600">Caricamento varianti...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {variantiProdotto.map((variante) => (
                    <div key={variante.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {variante.image && (
                        <div className="relative w-full h-48 mb-3">
                          <Image
                            src={variante.image}
                            alt={variante.name}
                            fill
                            className="object-cover rounded"
                            onError={(e) => {
                              console.warn(`Errore caricamento immagine variante modal: ${variante.image}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <h4 className="font-semibold text-gray-800 mb-2">{variante.name}</h4>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Colore:</span>
                        {variante.color_code && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: variante.color_code }}
                            title={variante.color}
                          />
                        )}
                        <span className="text-sm text-gray-600">{variante.color}</span>
                      </div>
                      
                      {variante.size && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600">Taglia: </span>
                          <span className="text-sm font-medium">{variante.size}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {variante.price} {variante.currency}
                        </span>
                        
                        <Link
                          href={`/shop/personalizza/${prodottoSelezionato.id}/${variante.id}`}
                          className={`px-4 py-2 rounded font-medium transition-colors ${
                            variante.in_stock
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                          onClick={variante.in_stock ? undefined : (e) => e.preventDefault()}
                        >
                          {variante.in_stock ? 'Personalizza' : 'Non Disponibile'}
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {variantiProdotto.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      Nessuna variante disponibile per questo prodotto
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Griglia prodotti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {prodotti.map((prodotto) => (
            <div key={prodotto.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Immagine prodotto */}
              <div className="relative w-full h-64">
                {prodotto.thumbnail_url ? (
                  <Image
                    src={prodotto.thumbnail_url}
                    alt={prodotto.nome}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.warn(`Errore caricamento immagine: ${prodotto.thumbnail_url}`);
                      // Nasconde l'immagine in caso di errore
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Nessuna immagine</span>
                  </div>
                )}
                
                {/* Badge tipo prodotto */}
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {prodotto.tipo}
                </div>
              </div>
              
              {/* Contenuto card */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {prodotto.nome}
                </h3>
                
                {/* Prezzo minimo */}
                {(() => {
                  const prezzoMin = getPrezzoMinimo(prodotto.sync_variants);
                  return prezzoMin ? (
                    <p className="text-gray-600 mb-4">
                      A partire da <span className="text-lg font-bold text-green-600">
                        €{prezzoMin.toFixed(2)}
                      </span>
                    </p>
                  ) : null;
                })()}
                
                {/* Varianti disponibili */}
                <p className="text-sm text-gray-500 mb-4">
                  {prodotto.sync_variants.length} varianti disponibili
                </p>
                
                {/* Bottone personalizza */}
                <button
                  onClick={() => caricaVariantiProdotto(prodotto)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Visualizza Opzioni
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {prodotti.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-bold text-white mb-2">Nessun prodotto disponibile</h3>
            <p className="text-blue-200">
              Assicurati di aver configurato i prodotti nel tuo negozio Printful
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
