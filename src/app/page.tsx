'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Leckerli_One } from 'next/font/google';

// Configura il font Leckerli One
const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});

// Lista dei giocatori disponibili organizzati per ruolo
const giocatoriPerRuolo = {
  portieri: ['Svilar', 'Carnesecchi'],
  difensori: ['Acerbi', 'Beukema', 'Abdulhamid', 'Adams'],
  centrocampisti: ['Barella', 'Calhanoglu', 'Pellegrini', 'Bernabe', 'Bongiorno'],
  attaccanti: ['Yldiz', 'Pulisic', 'Bonny', 'Beltran', 'Coincecao', 'Zambo', 'Alli']
};

// Posizioni predefinite per ogni ruolo nel canvas (ottimizzate per formato Instagram Stories 1080x1920)
const posizioniRuoli = {
  portieri: [
    { x: 540, y: 500 },   // Portiere titolare centro
    { x: 350, y: 600 },   // Portiere riserva sinistra
    { x: 730, y: 600 }    // Portiere riserva destra
  ],
  difensori: [
    { x: 180, y: 780 },   // Difensore sinistro
    { x: 370, y: 750 },   // Difensore centrale sinistro
    { x: 540, y: 730 },   // Difensore centrale
    { x: 700, y: 760 },   // Difensore centrale destro
    { x: 900, y: 780 },   // Difensore destro
    { x: 280, y: 900 },   // Riserva 1
    { x: 530, y: 910 },   // Riserva 2
    { x: 800, y: 900 }    // Riserva 3
  ],
  centrocampisti: [
    { x: 150, y: 1030 },   // Centrocampista sinistro
    { x: 360, y: 1050 },   // Centrocampista centrale sinistro
    { x: 540, y: 1070 },   // Centrocampista centrale
    { x: 720, y: 1050 },   // Centrocampista centrale destro
    { x: 930, y: 1030 },   // Centrocampista destro
    { x: 330, y: 1220 },   // Riserva 1
    { x: 540, y: 1250 },   // Riserva 2
    { x: 750, y: 1220 }    // Riserva 3
  ],
  attaccanti: [
    { x: 170, y: 1400 },  // Attaccante sinistro
    { x: 320, y: 1450 },  // Attaccante sx interno
    { x: 910, y: 1400 },  // Attaccante dx 
    { x: 770, y: 1450 },  // Attaccante destro interno
    { x: 470, y: 1500 },  // Att centro sx
    { x: 620, y: 1500 } // Att centro dx 2
  ]
};

interface GiocatoreSelezionato {
  nome: string;
  ruolo: 'portieri' | 'difensori' | 'centrocampisti' | 'attaccanti';
  x: number;
  y: number;
  id: string;
}

type Ruolo = 'portieri' | 'difensori' | 'centrocampisti' | 'attaccanti';

export default function Home() {
  const [giocatoriSelezionati, setGiocatoriSelezionati] = useState<GiocatoreSelezionato[]>([]);
  const [canvasScale, setCanvasScale] = useState(0.6);
  const [modalAperto, setModalAperto] = useState(false);
  const [ruoloSelezionato, setRuoloSelezionato] = useState<Ruolo | null>(null);
  const [posizioneSelezionata, setPosizioneSelezionata] = useState<{x: number, y: number} | null>(null);
  const [coloreBackground, setColoreBackground] = useState('#1A1414');
  const [nomeSquadra, setNomeSquadra] = useState('');
  const [dimensioneFontSquadra, setDimensioneFontSquadra] = useState(85);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Colori predefiniti
  const coloriPredefiniti = [
    { nome: 'Grigio Chiaro', colore: '#f1f5f9' },
    { nome: 'Azzurro', colore: '#dbeafe' },
    { nome: 'Verde Menta', colore: '#d1fae5' },
    { nome: 'Rosa', colore: '#fce7f3' },
    { nome: 'Giallo', colore: '#fef3c7' },
    { nome: 'Lavanda', colore: '#e0e7ff' },
    { nome: 'Pesca', colore: '#fed7aa' },
    { nome: 'Nero', colore: '#000000' }
  ];

  // Canvas responsive basato su larghezza E altezza del browser
  useEffect(() => {
    const calculateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Spazio disponibile considerando header e contatori
      const headerSpace = 80; // Spazio ridotto per titolo e padding
      const footerSpace = 40; // Spazio ridotto per contatore giocatori
      const availableHeight = windowHeight - headerSpace - footerSpace;
      const availableWidth = windowWidth * 0.95; // 95% della larghezza
      
      // Calcola le scale necessarie per entrambe le dimensioni
      const scaleByWidth = availableWidth / 1080;
      const scaleByHeight = availableHeight / 1920;
      
      // Usa la scala più restrittiva tra larghezza e altezza
      const calculatedScale = Math.min(scaleByWidth, scaleByHeight);
      
      // Applica limiti basati sul tipo di schermo
      if (windowWidth >= 1200 && windowHeight >= 900) {
        // Desktop grande: fino al 60% ma rispetta i limiti di spazio
        setCanvasScale(Math.min(calculatedScale, 0.6));
      } else if (windowWidth >= 768) {
        // Tablet o desktop piccolo: scala tra 20% e 50%
        setCanvasScale(Math.min(Math.max(calculatedScale, 0.2), 0.5));
      } else {
        // Mobile: scala tra 15% e 35%
        setCanvasScale(Math.min(Math.max(calculatedScale, 0.15), 0.35));
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const apriModal = (ruolo: Ruolo, posizione: {x: number, y: number}) => {
    setRuoloSelezionato(ruolo);
    setPosizioneSelezionata(posizione);
    setModalAperto(true);
  };

  const aggiungiGiocatore = (nomeGiocatore: string) => {
    if (!ruoloSelezionato || !posizioneSelezionata) return;

    const nuovoGiocatore: GiocatoreSelezionato = {
      nome: nomeGiocatore,
      ruolo: ruoloSelezionato,
      x: posizioneSelezionata.x,
      y: posizioneSelezionata.y,
      id: `${nomeGiocatore}-${Date.now()}`
    };
    setGiocatoriSelezionati(prev => [...prev, nuovoGiocatore]);
    setModalAperto(false);
    setRuoloSelezionato(null);
    setPosizioneSelezionata(null);
  };

  const rimuoviGiocatore = (id: string) => {
    setGiocatoriSelezionati(prev => prev.filter(g => g.id !== id));
  };



  const downloadImmagine = async () => {
    try {
      // Crea un canvas HTML nativo per Instagram Stories
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        alert('Errore nella creazione del canvas');
        return;
      }

      // Carica e disegna l'immagine del campo
      const fieldImage = document.createElement('img');
      fieldImage.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        fieldImage.onload = () => {
          // Disegna l'immagine del campo per riempire tutto il canvas
          ctx.drawImage(fieldImage, 0, 0, 1080, 1920);
          resolve();
        };
        
        fieldImage.onerror = () => {
          console.warn('Impossibile caricare field.jpg, uso sfondo verde');
          // Fallback: sfondo verde se l'immagine non si carica
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, 0, 1080, 1920);
          resolve();
        };
        
        fieldImage.src = '/field.jpg';
      });

      // Disegna il nome della squadra se presente
      if (nomeSquadra) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${dimensioneFontSquadra}px "Leckerli One", cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        
        // Dividi il testo in righe
        const righe = nomeSquadra.split('\n');
        const altezzaRiga = dimensioneFontSquadra * 1.1; // Line height 1.1
        const yStart = 200 - ((righe.length - 1) * altezzaRiga / 2);
        
        righe.forEach((riga, index) => {
          const y = yStart + (index * altezzaRiga);
          // Disegna il contorno del testo per migliore leggibilità
          ctx.strokeText(riga, 540, y);
          // Disegna il testo bianco sopra
          ctx.fillText(riga, 540, y);
        });
      }

      // Funzione per caricare e disegnare un'immagine
      const loadAndDrawImage = (giocatore: GiocatoreSelezionato): Promise<void> => {
        return new Promise((resolve) => {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            // Usa le stesse dimensioni e posizioni dell'editor
            const x = giocatore.x - 200; // Centro dell'immagine a 400px
            const y = giocatore.y - 200;
            const size = 400; // Dimensione originale dell'editor
            
            // Calcola le dimensioni per mantenere l'aspect ratio
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            
            // Calcola la scala per far entrare l'immagine nel cerchio
            const scale = Math.max(size / imgWidth, size / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Centra l'immagine scalata
            const imgX = x + (size - scaledWidth) / 2;
            const imgY = y + (size - scaledHeight) / 2;
            
            // Salva il contesto
            ctx.save();
            
            // Crea un percorso circolare per il clipping
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
            ctx.clip();
            
            // Disegna l'immagine nel cerchio mantenendo le proporzioni
            ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
            
            // Ripristina il contesto
            ctx.restore();
            
            resolve();
          };
          
          img.onerror = () => {
            console.warn(`Impossibile caricare: ${giocatore.nome}`);
            // Disegna un cerchio colorato come fallback con le stesse dimensioni
            const x = giocatore.x - 200;
            const y = giocatore.y - 200;
            const size = 400;
            
            const color = 
              giocatore.ruolo === 'portieri' ? '#10b981' :
              giocatore.ruolo === 'difensori' ? '#3b82f6' :
              giocatore.ruolo === 'centrocampisti' ? '#f59e0b' : '#ef4444';
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Aggiungi il nome con dimensioni proporzionate
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial'; // Font più grande per leggibilità
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(giocatore.nome, x + size/2, y + size/2);
            
            resolve();
          };
          
          // Imposta il src per iniziare il caricamento
          img.src = `/giocatori/${giocatore.nome}.webp`;
        });
      };

      // Ordina i giocatori per Z-index (come nell'editor): portieri < difensori < centrocampisti < attaccanti
      const giocatoriOrdinati = [...giocatoriSelezionati].sort((a, b) => {
        const zIndexA = 
          a.ruolo === 'portieri' ? 10 :
          a.ruolo === 'difensori' ? 20 :
          a.ruolo === 'centrocampisti' ? 30 : 40; // attaccanti
        
        const zIndexB = 
          b.ruolo === 'portieri' ? 10 :
          b.ruolo === 'difensori' ? 20 :
          b.ruolo === 'centrocampisti' ? 30 : 40; // attaccanti
        
        return zIndexA - zIndexB;
      });

      // Carica e disegna tutti i giocatori nell'ordine corretto dei layer
      if (giocatoriOrdinati.length > 0) {
        for (const giocatore of giocatoriOrdinati) {
          await loadAndDrawImage(giocatore);
        }
      }

      // Scarica l'immagine
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `fantacover-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          alert('Errore nella creazione dell\'immagine');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Errore durante il download:', error);
      alert('Errore durante il download dell\'immagine');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-4" 
      style={{ 
        backgroundColor: coloreBackground,
        backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundRepeat: 'repeat'
      }}
    >
      <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-center text-white mt-6 mb-6 transform -rotate-2 ${leckerliOne.className}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
        Fantacover.it
      </h1>

      {/* Color Picker per sfondo - temporaneamente nascosto */}
      {false && (
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-gray-700 mb-2 text-center">Colore Sfondo</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {coloriPredefiniti.map((item) => (
                <button
                  key={item.colore}
                  onClick={() => setColoreBackground(item.colore)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    coloreBackground === item.colore 
                      ? 'border-white shadow-lg scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: item.colore }}
                  title={item.nome}
                />
              ))}
            </div>
            <input
              type="color"
              value={coloreBackground}
              onChange={(e) => setColoreBackground(e.target.value)}
              className="w-full h-8 mt-2 rounded border border-gray-300 cursor-pointer"
              title="Colore personalizzato"
            />
          </div>
        </div>
      )}

      {/* Contatore totale giocatori */}
      <div className="text-center mb-2">
        <span className="text-white text-lg font-semibold">
          Giocatori selezionati: {giocatoriSelezionati.length}/25
        </span>
      </div>

      {/* Editor nome squadra */}
      <div className="flex justify-center mb-6">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg mx-4 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">Nome della Squadra</p>
          <textarea
            value={nomeSquadra}
            onChange={(e) => {
              const value = e.target.value;
              // Conta i line break
              const lineBreaks = (value.match(/\n/g) || []).length;
              // Permetti al massimo 1 line break (2 righe totali)
              if (lineBreaks <= 1) {
                setNomeSquadra(value);
              }
            }}
            onKeyDown={(e) => {
              // Permetti Invio solo se non c'è già un line break
              if (e.key === 'Enter') {
                const lineBreaks = (nomeSquadra.match(/\n/g) || []).length;
                if (lineBreaks >= 1) {
                  e.preventDefault(); // Blocca ulteriori Invio
                }
              }
            }}
            placeholder="Inserisci il nome della squadra..."
            className="border border-gray-300 rounded-lg text-center font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none"
            style={{ 
              textAlign: 'center',
              lineHeight: '1.2',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '12px',
              paddingRight: '12px',
              verticalAlign: 'middle',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordWrap: 'normal',
              minWidth: '200px',
              width: 'auto',
              maxWidth: 'none'
            }}
            maxLength={50}
            rows={2}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dimensione:</label>
            <input
              type="range"
              min="24"
              max="100"
              value={dimensioneFontSquadra}
              onChange={(e) => setDimensioneFontSquadra(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-right">{dimensioneFontSquadra}</span>
          </div>
        </div>
      </div>
      
      {/* Canvas dell'immagine - Sempre centrato */}
      <div className="flex justify-center">
        <div 
          ref={canvasRef}
          data-canvas-ref="true"
          className="relative border-8 border-gray-300 rounded-lg"
          style={{
            width: `${1080 * canvasScale}px`,
            height: `${1920 * canvasScale}px`,
            backgroundImage: 'url(/field.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Nome della squadra */}
          {nomeSquadra && (
            <div
              className={`absolute text-center font-bold text-white flex items-center justify-center ${leckerliOne.className}`}
              style={{
                left: (540 - 400) * canvasScale,
                top: (200 - (dimensioneFontSquadra * canvasScale)) * canvasScale,
                width: `${800 * canvasScale}px`,
                height: `${dimensioneFontSquadra * canvasScale * 2}px`,
                fontSize: `${dimensioneFontSquadra * canvasScale}px`,
                textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                zIndex: 60,
                lineHeight: '1.1',
                whiteSpace: 'pre-line'
              }}
            >
              {nomeSquadra}
            </div>
          )}

          {/* Posizioni disponibili e giocatori */}
          {Object.entries(posizioniRuoli).map(([ruolo, posizioni]) =>
            posizioni.map((pos, index) => {
              const giocatoreInPosizione = giocatoriSelezionati.find(g =>
                Math.abs(g.x - pos.x) < 10 && Math.abs(g.y - pos.y) < 10
              );

              if (giocatoreInPosizione) {
                // Mostra il giocatore
                const zIndex = 
                  giocatoreInPosizione.ruolo === 'attaccanti' ? 40 :
                  giocatoreInPosizione.ruolo === 'centrocampisti' ? 30 :
                  giocatoreInPosizione.ruolo === 'difensori' ? 20 : 10;

                return (
                  <div
                    key={giocatoreInPosizione.id}
                    className="absolute cursor-pointer"
                    style={{
                      left: (pos.x - 200) * canvasScale,
                      top: (pos.y - 200) * canvasScale,
                      width: `${400 * canvasScale}px`,
                      height: `${400 * canvasScale}px`,
                      zIndex: zIndex
                    }}
                    onClick={() => rimuoviGiocatore(giocatoreInPosizione.id)}
                  >
                    <Image
                      src={`/giocatori/${giocatoreInPosizione.nome}.webp`}
                      alt={giocatoreInPosizione.nome}
                      width={400 * canvasScale}
                      height={400 * canvasScale}
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                );
              } else {
                // Mostra il cerchio +
                return (
                  <div
                    key={`${ruolo}-${index}`}
                    className="absolute cursor-pointer flex items-center justify-center bg-white bg-opacity-80 border-4 border-gray-400 rounded-full hover:bg-opacity-100 transition-all"
                    style={{
                      left: (pos.x - 45) * canvasScale,
                      top: (pos.y - 45) * canvasScale,
                      width: `${90 * canvasScale}px`,
                      height: `${90 * canvasScale}px`,
                      zIndex: 50
                    }}
                    onClick={() => apriModal(ruolo as Ruolo, pos)}
                  >
                    <span className="text-gray-600 text-4xl font-bold" style={{ fontSize: `${36 * canvasScale}px` }}>+</span>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Bottone Download */}
      {giocatoriSelezionati.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={downloadImmagine}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Scarica Immagine
          </button>
        </div>
      )}

      {/* Modal per selezione giocatori */}
      {modalAperto && ruoloSelezionato && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                Seleziona {ruoloSelezionato.charAt(0).toUpperCase() + ruoloSelezionato.slice(1)}
              </h3>
              <button
                onClick={() => setModalAperto(false)}
                className="text-gray-300 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {giocatoriPerRuolo[ruoloSelezionato].map((giocatore) => (
                <button
                  key={giocatore}
                  onClick={() => aggiungiGiocatore(giocatore)}
                  className={`p-3 text-left rounded hover:bg-gray-800 border transition-colors text-white ${
                    ruoloSelezionato === 'portieri' ? 'border-green-500 hover:border-green-400' :
                    ruoloSelezionato === 'difensori' ? 'border-blue-500 hover:border-blue-400' :
                    ruoloSelezionato === 'centrocampisti' ? 'border-yellow-500 hover:border-yellow-400' :
                    'border-red-500 hover:border-red-400'
                  }`}
                >
                  {giocatore}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
