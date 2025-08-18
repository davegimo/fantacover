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
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lista delle squadre disponibili
  const squadreDisponibili = [
    'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Cremonese', 'Fiorentina', 
    'Genoa', 'Hellas Verona', 'Inter', 'Juventus', 'Lazio', 'Lecce', 
    'Milan', 'Napoli', 'Parma', 'Pisa', 'Roma', 'Sassuolo', 'Torino', 'Udinese'
  ];

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
    setSquadraSelezionata(null);
    setGiocatoriSquadra([]);
    setModalAperto(true);
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
          img.src = `/giocatori2/${giocatore.squadra}/${giocatore.nome}.webp`;
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

  const condividiInstagram = async () => {
    const canvas = await downloadImmagine();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          // Crea un file temporaneo
          const file = new File([blob], `fantacover-${Date.now()}.png`, { type: 'image/png' });
          
          // Prova a usare l'API Web Share se disponibile
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'La mia Fantacover',
              text: 'Guarda la mia formazione creata con Fantacover!',
              files: [file]
            }).catch(console.error);
          } else {
            // Fallback: copia il link negli appunti e apri Instagram
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fantacover-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Prova ad aprire Instagram
            setTimeout(() => {
              window.open('https://www.instagram.com/', '_blank');
            }, 1000);
          }
        }
      }, 'image/png');
    }
  };

  const condividiWhatsApp = async () => {
    const canvas = await downloadImmagine();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          // Crea un file temporaneo
          const file = new File([blob], `fantacover-${Date.now()}.png`, { type: 'image/png' });
          
          // Prova a usare l'API Web Share se disponibile
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: 'La mia Fantacover',
              text: 'Guarda la mia formazione creata con Fantacover! 🏆⚽',
              files: [file]
            }).catch(console.error);
          } else {
            // Fallback: scarica l'immagine e apri WhatsApp con messaggio
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fantacover-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Apri WhatsApp con messaggio predefinito
            const message = encodeURIComponent('Guarda la mia formazione creata con Fantacover! 🏆⚽ https://fantacover.it');
            setTimeout(() => {
              window.open(`https://wa.me/?text=${message}`, '_blank');
            }, 1000);
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
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={scaricaImmagine}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Scarica Immagine
            </button>
            
            <button
              onClick={condividiInstagram}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </button>
            
            <button
              onClick={condividiWhatsApp}
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.306"/>
              </svg>
              WhatsApp
            </button>
          </div>
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
                      src={`/giocatori2/${giocatoreInPosizione.squadra}/${giocatoreInPosizione.nome}.webp`}
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

      {/* Modal per selezione giocatori */}
      {modalAperto && ruoloSelezionato && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {!squadraSelezionata ? 'Seleziona Squadra' : `Seleziona ${ruoloSelezionato.charAt(0).toUpperCase() + ruoloSelezionato.slice(1)} - ${squadraSelezionata}`}
              </h3>
              <button
                onClick={() => {
                  setModalAperto(false);
                  setSquadraSelezionata(null);
                  setGiocatoriSquadra([]);
                }}
                className="text-gray-300 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {!squadraSelezionata ? (
              // Prima fase: selezione squadra
              <div className="grid grid-cols-2 gap-2">
                {squadreDisponibili.map((squadra) => (
                  <button
                    key={squadra}
                    onClick={() => selezionaSquadra(squadra)}
                    className="p-3 text-center rounded hover:bg-gray-800 border border-gray-600 hover:border-gray-500 transition-colors text-white text-sm"
                  >
                    {squadra}
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
