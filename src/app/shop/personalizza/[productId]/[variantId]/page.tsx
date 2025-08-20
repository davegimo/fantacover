'use client';

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Leckerli_One } from 'next/font/google';

const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});

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

interface ProdottoDettaglio {
  id: number;
  nome: string;
  tipo: string;
  thumbnail_url: string;
  sync_variants: VarianteProdotto[];
}

interface MockupResult {
  placement: string;
  mockup_url: string;
  variant_id: number;
}

export default function PersonalizzaProdottoPage({ 
  params 
}: { 
  params: Promise<{ productId: string; variantId: string }> 
}) {
  // Unwrap dei parametri usando React.use()
  const { productId, variantId } = use(params);
  const [prodotto, setProdotto] = useState<ProdottoDettaglio | null>(null);
  const [variante, setVariante] = useState<{
    id: number;
    name: string;
    size: string;
    color: string;
    price: string;
    currency: string;
    in_stock: boolean;
    catalog_product_id: number;
    catalog_variant_id: number;
    image?: string;
    color_code?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [immagineFantacalcio, setImmagineFantacalcio] = useState<string | null>(null);
  const [mockups, setMockups] = useState<MockupResult[]>([]);
  const [loadingPersonalizzazione, setLoadingPersonalizzazione] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carica i dettagli del prodotto e trova la variante specifica
  useEffect(() => {
    const caricaProdotto = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/printful/product/${productId}`);
        const data = await response.json();

        if (data.success) {
          setProdotto(data.prodotto);
          
          // Trova la variante specifica
          const varianteSelezionata = data.prodotto.sync_variants.find(
            (v: VarianteProdotto) => v.id === parseInt(variantId)
          );
          
          if (varianteSelezionata) {
            setVariante(varianteSelezionata);
          } else {
            setError('Variante prodotto non trovata');
          }
          
          setError(null);
        } else {
          setError(data.error || 'Errore nel caricamento del prodotto');
        }
      } catch (err) {
        console.error('Errore nel caricamento prodotto:', err);
        setError('Errore di connessione');
      } finally {
        setLoading(false);
      }
    };

    caricaProdotto();
  }, [productId, variantId]);

  // Carica l'immagine della formazione salvata nel localStorage
  useEffect(() => {
    const caricaImmagineSalvata = () => {
      if (typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('fantacoverSession');
        if (sessionData) {
          try {
            const data = JSON.parse(sessionData);
            if (data.giocatoriSelezionati && data.giocatoriSelezionati.length > 0) {
              // Se ci sono giocatori salvati, genera automaticamente l'immagine
              generaImmagineDaSessione(data);
            }
          } catch (error) {
            console.error('Errore nel caricare la sessione:', error);
          }
        }
      }
    };

    caricaImmagineSalvata();
  }, []);

  // Genera l'immagine della formazione dai dati salvati
  const generaImmagineDaSessione = async (sessionData: {
    nomeSquadra?: string;
    dimensioneFontSquadra?: number;
    giocatoriSelezionati?: Array<{
      x: number;
      y: number;
      nome: string;
      squadra: string;
      ruolo: string;
    }>;
  }) => {
    try {
      // Usa la stessa logica del componente principale per generare l'immagine
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Carica e disegna l'immagine del campo
      const fieldImage = document.createElement('img');
      fieldImage.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        fieldImage.onload = () => {
          ctx.drawImage(fieldImage, 0, 0, 1080, 1920);
          resolve();
        };
        
        fieldImage.onerror = () => {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, 0, 1080, 1920);
          resolve();
        };
        
        fieldImage.src = '/field.jpg';
      });

      // Disegna il nome della squadra se presente
      if (sessionData.nomeSquadra) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${sessionData.dimensioneFontSquadra || 100}px "Fredoka", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        
        const righe = sessionData.nomeSquadra.split('\n');
        const altezzaRiga = (sessionData.dimensioneFontSquadra || 100) * 1.1;
        const yStart = 200 - ((righe.length - 1) * altezzaRiga / 2);
        
        righe.forEach((riga: string, index: number) => {
          const y = yStart + (index * altezzaRiga);
          ctx.strokeText(riga, 540, y);
          ctx.fillText(riga, 540, y);
        });
      }

      // Disegna la scritta fantacover.it
      ctx.fillStyle = 'white';
      ctx.font = `bold 69px "Leckerli One", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      
      ctx.save();
      ctx.translate(540, 1860);
      ctx.rotate(-2 * Math.PI / 180);
      ctx.strokeText('Fantacover.it', 0, 0);
      ctx.fillText('Fantacover.it', 0, 0);
      ctx.restore();

      // Disegna i giocatori (versione semplificata)
      if (sessionData.giocatoriSelezionati) {
        for (const giocatore of sessionData.giocatoriSelezionati) {
          const x = giocatore.x - 200;
          const y = giocatore.y - 200;
          const size = 400;
          
          // Prova a caricare l'immagine del giocatore
          try {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve) => {
              img.onload = () => {
                // Calcola le dimensioni per mantenere l'aspect ratio
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                const scale = Math.max(size / imgWidth, size / imgHeight);
                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;
                const imgX = x + (size - scaledWidth) / 2;
                const imgY = y;
                
                // Clipping path
                ctx.save();
                ctx.beginPath();
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                const radius = size / 2;
                ctx.rect(x, y, size, size / 2);
                ctx.arc(centerX, centerY, radius, 0, Math.PI);
                ctx.clip();
                ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
                ctx.restore();
                resolve();
              };
              
              img.onerror = () => {
                // Fallback: forma colorata
                const color = 
                  giocatore.ruolo === 'portieri' ? '#10b981' :
                  giocatore.ruolo === 'difensori' ? '#3b82f6' :
                  giocatore.ruolo === 'centrocampisti' ? '#f59e0b' : '#ef4444';
                
                ctx.fillStyle = color;
                ctx.beginPath();
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                const radius = size / 2;
                ctx.rect(x, y, size, size / 2);
                ctx.arc(centerX, centerY, radius, 0, Math.PI);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(giocatore.nome, x + size/2, y + size/2);
                resolve();
              };
              
              img.src = `/giocatori2/${giocatore.squadra}/${giocatore.nome}.webp`;
            });
          } catch (error) {
            console.warn('Errore nel caricare immagine giocatore:', giocatore.nome);
          }
        }
      }

      // Converti il canvas in base64
      const dataUrl = canvas.toDataURL('image/png');
      setImmagineFantacalcio(dataUrl);
      
    } catch (error) {
      console.error('Errore nella generazione immagine:', error);
    }
  };

  // Gestisce il caricamento di un file immagine
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImmagineFantacalcio(dataUrl);
        setMockups([]); // Reset mockups quando cambia l'immagine
        setFileId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Applica l'immagine al prodotto e genera l'anteprima
  const applicaImmagine = async () => {
    if (!immagineFantacalcio || !variante) return;

    try {
      setLoadingPersonalizzazione(true);
      
      const response = await fetch('/api/printful/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          variantId: variante.id,
          imageBase64: immagineFantacalcio,
          positionOptions: {
            placement: 'front',
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 1800,
              top: 300,
              left: 0
            }
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setFileId(data.fileId);
        setMockups(data.mockups || []);
      } else {
        setError(data.error || 'Errore nella personalizzazione');
      }
    } catch (err) {
      console.error('Errore nella personalizzazione:', err);
      setError('Errore nella personalizzazione del prodotto');
    } finally {
      setLoadingPersonalizzazione(false);
    }
  };

  // Procedi all'acquisto (reindirizza a Printful o gestisci checkout)
  const procediAcquisto = () => {
    if (!fileId || !variante) {
      alert('Devi prima applicare l\'immagine al prodotto');
      return;
    }

    // Per ora mostra un alert con le informazioni
    alert(`Funzionalità di checkout in sviluppo!\n\nProdotto: ${prodotto?.nome}\nVariante: ${variante.name}\nPrezzo: ${variante.price} ${variante.currency}\nFile ID: ${fileId}`);
    
    // TODO: Implementare il checkout vero con Printful
    // Questo potrebbe includere:
    // 1. Creazione di un ordine temporaneo
    // 2. Reindirizzamento al checkout di Printful
    // 3. Gestione del pagamento
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Caricamento prodotto...</h3>
        </div>
      </div>
    );
  }

  if (error || !prodotto || !variante) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Errore</h3>
          <p className="text-gray-600 text-center">
            Errore nel caricamento del prodotto. Riprova più tardi.
          </p>
          <Link 
            href="/shop"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Torna al negozio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/shop" className="flex items-center gap-4 text-white hover:text-blue-200 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-lg font-semibold">Torna al Negozio</span>
          </Link>
          
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white transform -rotate-2 ${leckerliOne.className}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            Personalizza Prodotto
          </h1>
          
          <div className="w-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonna sinistra - Dettagli prodotto */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{prodotto.nome}</h2>
            
            {/* Immagine prodotto */}
            <div className="relative w-full h-64 mb-4">
              {variante.image ? (
                <Image
                  src={variante.image}
                  alt={variante.name}
                  fill
                  className="object-cover rounded"
                  onError={(e) => {
                    console.warn(`Errore caricamento immagine variante: ${variante.image}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-gray-500">Nessuna immagine</span>
                </div>
              )}
            </div>
            
            {/* Dettagli variante */}
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">Nome: </span>
                <span className="text-gray-600">{variante.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Colore: </span>
                {variante.color_code && (
                  <div 
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: variante.color_code }}
                  />
                )}
                <span className="text-gray-600">{variante.color}</span>
              </div>
              
              {variante.size && (
                <div>
                  <span className="font-semibold text-gray-700">Taglia: </span>
                  <span className="text-gray-600">{variante.size}</span>
                </div>
              )}
              
              <div>
                <span className="font-semibold text-gray-700">Prezzo: </span>
                <span className="text-2xl font-bold text-green-600">
                  {variante.price} {variante.currency}
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Disponibilità: </span>
                <span className={variante.in_stock ? 'text-green-600' : 'text-red-600'}>
                  {variante.in_stock ? 'Disponibile' : 'Non Disponibile'}
                </span>
              </div>
            </div>
          </div>

          {/* Colonna destra - Personalizzazione */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Personalizzazione</h2>
            
            {/* Caricamento immagine */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Immagine della tua rosa</h3>
              
              {immagineFantacalcio ? (
                <div className="relative">
                  <div className="relative w-full h-64 mb-3">
                    <Image
                      src={immagineFantacalcio}
                      alt="Rosa fantacalcio"
                      fill
                      className="object-cover rounded border"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setImmagineFantacalcio(null);
                      setMockups([]);
                      setFileId(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Rimuovi immagine
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📷</div>
                  <p className="text-gray-600 mb-4">
                    Carica l&apos;immagine della tua rosa di fantacalcio o usa quella salvata automaticamente
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Scegli File
                  </label>
                </div>
              )}
            </div>

            {/* Bottone applica immagine */}
            {immagineFantacalcio && (
              <div className="mb-6">
                <button
                  onClick={applicaImmagine}
                  disabled={loadingPersonalizzazione}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    loadingPersonalizzazione
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {loadingPersonalizzazione ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Applicando...
                    </div>
                  ) : (
                    'Applica al Prodotto'
                  )}
                </button>
              </div>
            )}

            {/* Anteprime mockup */}
            {mockups.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Anteprima Prodotto</h3>
                <div className="grid grid-cols-1 gap-4">
                  {mockups.map((mockup, index) => (
                    <div key={index} className="relative w-full h-64">
                      <Image
                        src={mockup.mockup_url}
                        alt={`Anteprima ${mockup.placement}`}
                        fill
                        className="object-cover rounded border"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {mockup.placement}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottone acquisto */}
            {fileId && (
              <button
                onClick={procediAcquisto}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
              >
                Procedi all&apos;Acquisto - {variante.price} {variante.currency}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
