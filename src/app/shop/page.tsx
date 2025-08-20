'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ShopPage() {
  const [products, setProducts] = useState<Array<{
    id: number;
    name: string;
    thumbnail: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica i prodotti dal negozio Printful
  useEffect(() => {
    const caricaProdotti = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/printful/products');
        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
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
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-white transform -rotate-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
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
            Scegli un prodotto, applica la tua formazione e procedi all&apos;acquisto
          </p>
        </div>

        {/* Griglia prodotti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Immagine prodotto */}
              <div className="relative h-64 bg-gray-200">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-500 text-lg">🛍️</span>
                  </div>
                )}
              </div>
              
              {/* Info prodotto */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {product.name}
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Prodotto #{product.id}
                  </span>
                  
                  <Link
                    href={`/shop/personalizza/${product.id}`}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Personalizza
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-bold text-white mb-2">Nessun prodotto disponibile</h3>
            <p className="text-gray-600 text-center">
              Non ci sono prodotti disponibili al momento. Riprova più tardi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
