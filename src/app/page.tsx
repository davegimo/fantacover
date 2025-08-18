'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Leckerli_One } from 'next/font/google';

// Configura il font Leckerli One
const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});



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
    
    { x: 930, y: 1030 },   // Centrocampista destro
    { x: 720, y: 1050 },   // Centrocampista centrale destro
    { x: 540, y: 1070 },   // Centrocampista centrale
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
  squadra: string;
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
  const [squadraSelezionata, setSquadraSelezionata] = useState<string | null>(null);
  const [giocatoriSquadra, setGiocatoriSquadra] = useState<string[]>([]);
  const [coloreBackground, setColoreBackground] = useState('#1A1414');
  const [nomeSquadra, setNomeSquadra] = useState('');
  const [dimensioneFontSquadra, setDimensioneFontSquadra] = useState(85);
  const [isMobile, setIsMobile] = useState(false);
  const [giocatorePreDelete, setGiocatorePreDelete] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lista delle squadre disponibili
  const squadreDisponibili = [
    'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Cremonese', 'Fiorentina', 
    'Genoa', 'Hellas Verona', 'Inter', 'Juventus', 'Lazio', 'Lecce', 
    'Milan', 'Napoli', 'Parma', 'Pisa', 'Roma', 'Sassuolo', 'Torino', 'Udinese'
  ];

  // Mapping tra nomi squadre e file loghi
  const logoMapping: { [key: string]: string } = {
    'Atalanta': 'atalanta.webp',
    'Bologna': 'bologna.webp',
    'Cagliari': 'cagliari.webp',
    'Como': 'como.webp',
    'Cremonese': 'cremonese.webp',
    'Fiorentina': 'fiorentina.webp',
    'Genoa': 'genoa.webp',
    'Hellas Verona': 'verona.webp',
    'Inter': 'inter.webp',
    'Juventus': 'juve.webp',
    'Lazio': 'lazio.webp',
    'Lecce': 'lecce.webp',
    'Milan': 'milan.webp',
    'Napoli': 'Napoli.webp',
    'Parma': 'parma.webp',
    'Pisa': 'pisa.webp',
    'Roma': 'roma.webp',
    'Sassuolo': 'sassuolo.webp',
    'Torino': 'torino.webp',
    'Udinese': 'udinese.webp'
  };

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

  // Previeni scroll del body quando il modal è aperto
  useEffect(() => {
    if (modalAperto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalAperto]);

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

  // Rileva se il dispositivo è mobile
  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        // Controlla se il dispositivo supporta il touch E ha una larghezza piccola
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const hasWebShareAPI = 'share' in navigator;
        
        setIsMobile(isTouchDevice && isSmallScreen && hasWebShareAPI);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Funzione helper per determinare il formato immagine disponibile
  const getImagePath = async (squadra: string, nome: string): Promise<string> => {
    // Prova prima .webp, poi .png
    const formats = ['webp', 'png'];
    
    for (const format of formats) {
      const path = `/giocatori2/${squadra}/${nome}.${format}`;
      try {
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          return path;
        }
             } catch {
         // Continua con il prossimo formato
       }
    }
    
    // Fallback al .webp se nessuno è trovato
    return `/giocatori2/${squadra}/${nome}.webp`;
  };

  // Componente per gestire il caricamento delle immagini con fallback
  const PlayerImage = ({ squadra, nome, width, height, className, alt }: {
    squadra: string;
    nome: string;
    width: number;
    height: number;
    className?: string;
    alt: string;
  }) => {
    const [currentSrc, setCurrentSrc] = useState<string>(`/giocatori2/${squadra}/${nome}.webp`);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      if (currentSrc.endsWith('.webp')) {
        // Prova con .png
        setCurrentSrc(`/giocatori2/${squadra}/${nome}.png`);
        setHasError(false);
      } else {
        // Entrambi i formati hanno fallito
        setHasError(true);
      }
    };

    const handleLoad = () => {
      setHasError(false);
    };

    if (hasError) {
      return null; // Lascia che il componente padre gestisca l'errore
    }

    return (
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  };

  const apriModal = (ruolo: Ruolo, posizione: {x: number, y: number}) => {
    setRuoloSelezionato(ruolo);
    setPosizioneSelezionata(posizione);
    setSquadraSelezionata(null);
    setGiocatoriSquadra([]);
    setModalAperto(true);
    setGiocatorePreDelete(null);
  };

  const selezionaSquadra = async (squadra: string) => {
    setSquadraSelezionata(squadra);
    
    try {
      // Carica la lista dei giocatori della squadra
      const response = await fetch(`/api/giocatori-squadra?squadra=${encodeURIComponent(squadra)}`);
      if (response.ok) {
        const giocatori = await response.json();
        setGiocatoriSquadra(giocatori);
      } else {
        // Fallback: prova a caricare alcuni giocatori comuni
        setGiocatoriSquadra(['Giocatore1', 'Giocatore2', 'Giocatore3']);
      }
    } catch (error) {
      console.error('Errore nel caricamento giocatori:', error);
      // Fallback con giocatori di esempio
      setGiocatoriSquadra(['Giocatore1', 'Giocatore2', 'Giocatore3']);
    }
  };

  const aggiungiGiocatore = (nomeGiocatore: string) => {
    if (!ruoloSelezionato || !posizioneSelezionata || !squadraSelezionata) return;

    const nuovoGiocatore: GiocatoreSelezionato = {
      nome: nomeGiocatore,
      ruolo: ruoloSelezionato,
      squadra: squadraSelezionata,
      x: posizioneSelezionata.x,
      y: posizioneSelezionata.y,
      id: `${nomeGiocatore}-${Date.now()}`
    };
    setGiocatoriSelezionati(prev => [...prev, nuovoGiocatore]);
    setModalAperto(false);
    setRuoloSelezionato(null);
    setPosizioneSelezionata(null);
    setSquadraSelezionata(null);
    setGiocatoriSquadra([]);
    setGiocatorePreDelete(null);
  };

  const rimuoviGiocatore = (id: string) => {
    setGiocatoriSelezionati(prev => prev.filter(g => g.id !== id));
    setGiocatorePreDelete(null);
  };

  const attivaPreDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setGiocatorePreDelete(id);
  };

  const annullaPreDelete = () => {
    setGiocatorePreDelete(null);
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

      // Disegna la scritta fantacover.it in basso a destra
      ctx.fillStyle = 'white';
      ctx.font = `bold 60px "Leckerli One", cursive`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      
      // Salva il contesto per la rotazione
      ctx.save();
      ctx.translate(1060, 1890); // Posizione in basso a destra
      ctx.rotate(-2 * Math.PI / 180); // Rotazione di -2 gradi
      
      // Disegna il contorno e il testo
      ctx.strokeText('Fantacover.it', 0, 0);
      ctx.fillText('Fantacover.it', 0, 0);
      
      // Ripristina il contesto
      ctx.restore();

      // Funzione per caricare e disegnare un'immagine
      const loadAndDrawImage = async (giocatore: GiocatoreSelezionato): Promise<void> => {
        return new Promise(async (resolve) => {
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
          
          // Usa la funzione helper per determinare il formato corretto
          const imagePath = await getImagePath(giocatore.squadra, giocatore.nome);
          img.src = imagePath;
        });
      };

      // Ordina i giocatori ESATTAMENTE come nel canvas seguendo l'ordine di posizioniRuoli
      const giocatoriOrdinati = [...giocatoriSelezionati].sort((a, b) => {
        // Trova l'indice di posizione per ogni giocatore nell'array posizioniRuoli
        const getPositionIndex = (giocatore: GiocatoreSelezionato) => {
          const posizioni = posizioniRuoli[giocatore.ruolo];
          const index = posizioni.findIndex(pos => 
            Math.abs(pos.x - giocatore.x) < 10 && Math.abs(pos.y - giocatore.y) < 10
          );
          return index !== -1 ? index : 999; // Se non trovato, metti alla fine
        };

        const indexA = getPositionIndex(a);
        const indexB = getPositionIndex(b);

        // Prima ordina per ruolo (portieri < difensori < centrocampisti < attaccanti)
        const ruoloOrderA = a.ruolo === 'portieri' ? 0 : a.ruolo === 'difensori' ? 1 : a.ruolo === 'centrocampisti' ? 2 : 3;
        const ruoloOrderB = b.ruolo === 'portieri' ? 0 : b.ruolo === 'difensori' ? 1 : b.ruolo === 'centrocampisti' ? 2 : 3;
        
        if (ruoloOrderA !== ruoloOrderB) {
          return ruoloOrderA - ruoloOrderB;
        }
        
        // Poi ordina per indice di posizione nell'array del ruolo
        return indexA - indexB;
      });

      // Carica e disegna tutti i giocatori nell'ordine corretto dei layer
      if (giocatoriOrdinati.length > 0) {
        for (const giocatore of giocatoriOrdinati) {
          await loadAndDrawImage(giocatore);
        }
      }

      // Ritorna il canvas per poterlo riutilizzare
      return canvas;

    } catch (error) {
      console.error('Errore durante la generazione dell\'immagine:', error);
      alert('Errore durante la generazione dell\'immagine');
      return null;
    }
  };

  const scaricaImmagine = async () => {
    const canvas = await downloadImmagine();
    if (canvas) {
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
        }
      }, 'image/png');
    }
  };



  // Funzione di condivisione unificata per mobile
  const condividiMobile = async () => {
    const canvas = await downloadImmagine();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `fantacover-${Date.now()}.png`, { type: 'image/png' });
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'La mia Fantacover',
              text: 'Guarda la mia formazione creata con Fantacover! 🏆⚽',
              files: [file]
            }).catch(console.error);
          } else {
            // Fallback: scarica l'immagine
            scaricaImmagine();
          }
        }
      }, 'image/png');
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

      {/* Bottoni di condivisione e download */}
      {giocatoriSelezionati.length > 0 && (
        <div className="flex justify-center mb-6">
          {isMobile ? (
            // Interfaccia mobile: solo bottone "Condividi"
            <button
              onClick={condividiMobile}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Condividi
            </button>
          ) : (
            // Interfaccia desktop: solo bottone scarica
            <button
              onClick={scaricaImmagine}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Scarica Immagine
            </button>
          )}
        </div>
      )}
      
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
          onClick={annullaPreDelete}
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
                zIndex: 45,
                lineHeight: '1.1',
                whiteSpace: 'pre-line'
              }}
            >
              {nomeSquadra}
            </div>
          )}

          {/* Scritta fantacover.it in basso a destra */}
          <div
            className={`absolute text-white font-bold transform -rotate-2 ${leckerliOne.className}`}
            style={{
              right: `${20 * canvasScale}px`,
              bottom: `${30 * canvasScale}px`,
              fontSize: `${60 * canvasScale}px`,
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              zIndex: 70
            }}
          >
            Fantacover.it
          </div>

          {/* Posizioni disponibili e giocatori */}
          {Object.entries(posizioniRuoli).map(([ruolo, posizioni]) =>
            posizioni.map((pos, index) => {
              const giocatoreInPosizione = giocatoriSelezionati.find(g =>
                Math.abs(g.x - pos.x) < 10 && Math.abs(g.y - pos.y) < 10
              );

              if (giocatoreInPosizione) {
                // Calcola z-index basato su ruolo + posizione nell'array
                const ruoloBase = 
                  giocatoreInPosizione.ruolo === 'portieri' ? 10 :
                  giocatoreInPosizione.ruolo === 'difensori' ? 20 :
                  giocatoreInPosizione.ruolo === 'centrocampisti' ? 30 : 40; // attaccanti
                
                // Aggiungi l'indice della posizione per l'ordinamento fine
                const zIndex = ruoloBase + index;

                const isPreDelete = giocatorePreDelete === giocatoreInPosizione.id;
                
                return (
                  <div
                    key={giocatoreInPosizione.id}
                    className="absolute cursor-pointer"
                    style={{
                      left: (pos.x - 200) * canvasScale,
                      top: (pos.y - 200) * canvasScale,
                      width: `${400 * canvasScale}px`,
                      height: `${400 * canvasScale}px`,
                      zIndex: isPreDelete ? 1000 : zIndex
                    }}
                    onClick={(e) => attivaPreDelete(giocatoreInPosizione.id, e)}
                  >
                    <div className="relative w-full h-full">
                      <PlayerImage
                        squadra={giocatoreInPosizione.squadra}
                        nome={giocatoreInPosizione.nome}
                        alt={giocatoreInPosizione.nome}
                        width={400 * canvasScale}
                        height={400 * canvasScale}
                        className={`rounded-full object-cover w-full h-full transition-all duration-200 ${
                          isPreDelete ? 'border-8 border-white' : ''
                        }`}
                      />
                      
                      {/* Pulsante di eliminazione */}
                      {isPreDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rimuoviGiocatore(giocatoreInPosizione.id);
                          }}
                          className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors duration-200 shadow-lg"
                          style={{
                            transform: 'translate(25%, -25%)',
                            fontSize: `${20 * canvasScale}px`,
                            width: `${48 * canvasScale}px`,
                            height: `${48 * canvasScale}px`
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      annullaPreDelete();
                      apriModal(ruolo as Ruolo, pos);
                    }}
                  >
                    <span className="text-gray-600 text-4xl font-bold" style={{ fontSize: `${36 * canvasScale}px` }}>+</span>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Modal per selezione giocatori */}
      {modalAperto && ruoloSelezionato && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setModalAperto(false);
            setSquadraSelezionata(null);
            setGiocatoriSquadra([]);
            setGiocatorePreDelete(null);
          }}
        >
          <div 
            className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {!squadraSelezionata ? 'Seleziona Squadra' : `Seleziona ${ruoloSelezionato.charAt(0).toUpperCase() + ruoloSelezionato.slice(1)} - ${squadraSelezionata}`}
              </h3>
              <button
                onClick={() => {
                  setModalAperto(false);
                  setSquadraSelezionata(null);
                  setGiocatoriSquadra([]);
                  setGiocatorePreDelete(null);
                }}
                className="text-gray-300 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {!squadraSelezionata ? (
              // Prima fase: selezione squadra
              <div className="grid grid-cols-1 gap-2">
                {squadreDisponibili.map((squadra) => (
                  <button
                    key={squadra}
                    onClick={() => selezionaSquadra(squadra)}
                    className="p-3 rounded hover:bg-gray-800 border border-gray-600 hover:border-gray-500 transition-colors text-white text-sm flex items-center gap-3"
                  >
                    <Image
                      src={`/Loghi/${logoMapping[squadra]}`}
                      alt={`Logo ${squadra}`}
                      width={32}
                      height={32}
                      className="rounded-full object-contain flex-shrink-0"
                    />
                    <span className="flex-grow text-left">{squadra}</span>
                  </button>
                ))}
              </div>
            ) : (
              // Seconda fase: selezione giocatore
              <div>
                <button
                  onClick={() => {
                    setSquadraSelezionata(null);
                    setGiocatoriSquadra([]);
                  }}
                  className="mb-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  ← Torna alle squadre
                </button>
                <div className="grid grid-cols-1 gap-2">
                  {giocatoriSquadra.map((giocatore) => (
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
                  {giocatoriSquadra.length === 0 && (
                    <p className="text-gray-400 text-center py-4">Caricamento giocatori...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
