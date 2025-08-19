'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Leckerli_One, Roboto, Oswald, Bebas_Neue, Fredoka, Righteous } from 'next/font/google';

// Interfaccia per i giocatori dall'Excel
interface GiocatoreExcel {
  ruolo: string;
  cognome: string;
  squadra: string;
}

// Interfaccia per i giocatori con info foto
interface GiocatoreConFoto {
  nome: string;
  hasFoto: boolean;
  giaSelezionato: boolean;
}

// Configura i font disponibili
const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const oswald = Oswald({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
});

const fredoka = Fredoka({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const righteous = Righteous({
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
    { x: 540, y: 1120 },   // Centrocampista centrale
    { x: 330, y: 1270 },   // Riserva 1
    { x: 540, y: 1300 },   // Riserva 2
    { x: 750, y: 1270 }    // Riserva 3
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
  const [giocatoriSquadra, setGiocatoriSquadra] = useState<GiocatoreConFoto[]>([]);
  const [coloreBackground, setColoreBackground] = useState('#1A1414');
  const [nomeSquadra, setNomeSquadra] = useState('Nome squadra');
  const [dimensioneFontSquadra, setDimensioneFontSquadra] = useState(100);
  const [fontSelezionato, setFontSelezionato] = useState('fredoka');
  const [isMobile, setIsMobile] = useState(false);
  const [giocatorePreDelete, setGiocatorePreDelete] = useState<string | null>(null);
  const [giocatoriExcel, setGiocatoriExcel] = useState<GiocatoreExcel[]>([]);
  const [loadingExcel, setLoadingExcel] = useState(true);
  const [loadingSessione, setLoadingSessione] = useState(true);
  const [statisticheFoto, setStatisticheFoto] = useState<{conFoto: number, totale: number} | null>(null);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [preloadedCanvas, setPreloadedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
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
        // Mobile: scala fissa per evitare cambiamenti con piccole variazioni di altezza
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobileDevice) {
          // Per dispositivi mobili: scala fissa basata sulla larghezza
          const fixedScale = Math.min(scaleByWidth * 0.9, 0.25);
          setCanvasScale(fixedScale);
        } else {
          // Per altri dispositivi piccoli: scala normale
          setCanvasScale(Math.min(Math.max(calculatedScale, 0.15), 0.35));
        }
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    // Per dispositivi mobili, aggiungi anche listener per orientationchange e visualViewport
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobileDevice) {
      window.addEventListener('orientationchange', () => {
        // Ritarda il calcolo per permettere al browser di completare la transizione
        setTimeout(calculateScale, 300);
      });
      
      // Se supportato, usa visualViewport per reagire ai cambiamenti della UI del browser
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', calculateScale);
      }
    }
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      if (isMobileDevice) {
        window.removeEventListener('orientationchange', calculateScale);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', calculateScale);
        }
      }
    };
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
  const PlayerImage = ({ squadra, nome, width, height, className, alt, style }: {
    squadra: string;
    nome: string;
    width: number;
    height: number;
    className?: string;
    alt: string;
    style?: React.CSSProperties;
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
        style={style}
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
    
    // Filtra i giocatori della squadra e del ruolo selezionato dai dati precaricati
    if (ruoloSelezionato && giocatoriExcel.length > 0) {
      const ruoloExcel = mappaRuolo(ruoloSelezionato);
      const giocatoriFiltrati = giocatoriExcel
        .filter(g => g.squadra === squadra && g.ruolo === ruoloExcel);
      
      // Controlla l'esistenza delle foto per ogni giocatore
      const giocatoriConFoto = await Promise.all(
        giocatoriFiltrati.map(async (giocatore) => {
          try {
            const response = await fetch(
              `/api/check-player-image?cognome=${encodeURIComponent(giocatore.cognome)}&squadra=${encodeURIComponent(giocatore.squadra)}`
            );
            const imageData = await response.json();
            
            // Controlla se il giocatore è già stato selezionato
            const giaSelezionato = giocatoriSelezionati.some(g => 
              g.nome === giocatore.cognome && g.squadra === giocatore.squadra
            );
            
            return {
              nome: giocatore.cognome,
              hasFoto: imageData.exists,
              giaSelezionato: giaSelezionato
            };
          } catch (error) {
            console.error(`Errore nel controllare l'immagine per ${giocatore.cognome}:`, error);
            return {
              nome: giocatore.cognome,
              hasFoto: false,
              giaSelezionato: false
            };
          }
        })
      );
      
      setGiocatoriSquadra(giocatoriConFoto);
    } else {
      setGiocatoriSquadra([]);
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
    // La sessione verrà salvata automaticamente dal useEffect
  };

  const rimuoviGiocatore = (id: string) => {
    setGiocatoriSelezionati(prev => prev.filter(g => g.id !== id));
    setGiocatorePreDelete(null);
    // La sessione verrà salvata automaticamente dal useEffect
  };

  const attivaPreDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setGiocatorePreDelete(id);
  };

  const annullaPreDelete = () => {
    setGiocatorePreDelete(null);
  };

  // Funzione per convertire il testo in Title Case (prima lettera di ogni parola maiuscola)
  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Mapping ruoli canvas -> ruoli Excel
  const mappaRuolo = (ruoloCanvas: Ruolo): string => {
    switch (ruoloCanvas) {
      case 'portieri': return 'P';
      case 'difensori': return 'D';
      case 'centrocampisti': return 'C';
      case 'attaccanti': return 'A';
      default: return '';
    }
  };

  // Ottieni la lettera del ruolo per il display
  const getLetteraRuolo = (ruolo: string): string => {
    return mappaRuolo(ruolo as Ruolo);
  };

  // Ottieni la classe CSS del font selezionato
  const getFontClass = (fontId: string) => {
    switch (fontId) {
      case 'leckerli': return leckerliOne.className;
      case 'roboto': return roboto.className;
      case 'oswald': return oswald.className;
      case 'bebas': return bebasNeue.className;
      case 'fredoka': return fredoka.className;
      case 'righteous': return righteous.className;
      default: return leckerliOne.className;
    }
  };

  // Ottieni il nome del font per il canvas HTML
  const getFontName = (fontId: string) => {
    switch (fontId) {
      case 'leckerli': return '"Leckerli One"';
      case 'roboto': return 'Roboto';
      case 'oswald': return 'Oswald';
      case 'bebas': return '"Bebas Neue"';
      case 'fredoka': return 'Fredoka';
      case 'righteous': return 'Righteous';
      default: return '"Leckerli One"';
    }
  };

  // Lista dei font disponibili
  const fontDisponibili = [
    { id: 'leckerli', nome: 'Leckerli One' },
    { id: 'roboto', nome: 'Roboto' },
    { id: 'oswald', nome: 'Oswald' },
    { id: 'bebas', nome: 'Bebas Neue' },
    { id: 'fredoka', nome: 'Fredoka' },
    { id: 'righteous', nome: 'Righteous' }
  ];

  // Funzioni per gestire il localStorage
  const salvaSessione = () => {
    if (typeof window !== 'undefined') {
      const sessionData = {
        nomeSquadra,
        fontSelezionato,
        dimensioneFontSquadra,
        giocatoriSelezionati,
        coloreBackground
      };
      localStorage.setItem('fantacoverSession', JSON.stringify(sessionData));
    }
  };

  const caricaSessione = () => {
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('fantacoverSession');
      if (sessionData) {
        try {
          const data = JSON.parse(sessionData);
          return data;
        } catch (error) {
          console.error('Errore nel caricare la sessione:', error);
        }
      }
    }
    return null;
  };

  // Colori caratteristici per ruolo
  const getColoriRuolo = (ruolo: Ruolo) => {
    switch (ruolo) {
      case 'portieri':
        return {
          bg: 'bg-orange-400 bg-opacity-80', // Giallo-Arancione con trasparenza
          border: 'border-orange-400',
          borderCanvas: 'border-orange-600 border-opacity-30', // Bordo più scuro e molto trasparente per canvas
          hover: 'hover:border-orange-300',
          text: 'text-orange-800'
        };
      case 'difensori':
        return {
          bg: 'bg-green-400 bg-opacity-80', // Verde chiaro medio con trasparenza
          border: 'border-green-400',
          borderCanvas: 'border-green-600 border-opacity-30', // Bordo più scuro e molto trasparente per canvas
          hover: 'hover:border-green-300',
          text: 'text-green-800'
        };
      case 'centrocampisti':
        return {
          bg: 'bg-sky-400 bg-opacity-80', // Blu chiaro con trasparenza
          border: 'border-sky-400',
          borderCanvas: 'border-sky-600 border-opacity-30', // Bordo più scuro e molto trasparente per canvas
          hover: 'hover:border-sky-300',
          text: 'text-sky-800'
        };
      case 'attaccanti':
        return {
          bg: 'bg-red-400 bg-opacity-80', // Rosso con trasparenza
          border: 'border-red-400',
          borderCanvas: 'border-red-600 border-opacity-30', // Bordo più scuro e molto trasparente per canvas
          hover: 'hover:border-red-300',
          text: 'text-red-800'
        };
      default:
        return {
          bg: 'bg-gray-400 bg-opacity-80',
          border: 'border-gray-400',
          borderCanvas: 'border-gray-600 border-opacity-30',
          hover: 'hover:border-gray-300',
          text: 'text-gray-800'
        };
    }
  };

  // Carica la sessione salvata all'avvio con animazione
  useEffect(() => {
    const caricaSessioneConAnimazione = async () => {
      const sessionData = caricaSessione();
      
      if (sessionData) {
        // Simula un caricamento per mostrare l'animazione
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Ripristina i dati progressivamente
        if (sessionData.nomeSquadra) setNomeSquadra(sessionData.nomeSquadra);
        if (sessionData.fontSelezionato) setFontSelezionato(sessionData.fontSelezionato);
        if (sessionData.dimensioneFontSquadra) setDimensioneFontSquadra(sessionData.dimensioneFontSquadra);
        if (sessionData.coloreBackground) setColoreBackground(sessionData.coloreBackground);
        
        // Piccola pausa prima di caricare i giocatori
        await new Promise(resolve => setTimeout(resolve, 200));
        if (sessionData.giocatoriSelezionati) setGiocatoriSelezionati(sessionData.giocatoriSelezionati);
      }
      
      // Termina il caricamento
      setLoadingSessione(false);
    };

    caricaSessioneConAnimazione();
  }, []);

  // Precarica i dati Excel all'avvio
  useEffect(() => {
    const caricaDatiExcel = async () => {
      try {
        setLoadingExcel(true);
        const response = await fetch('/api/excel-data');
        if (response.ok) {
          const data: GiocatoreExcel[] = await response.json();
          setGiocatoriExcel(data);
          
          // Calcola le statistiche delle foto
          await calcolaStatisticheFoto(data);
        }
      } catch (error) {
        console.error('Errore nel caricamento dati Excel:', error);
      } finally {
        setLoadingExcel(false);
      }
    };

    caricaDatiExcel();
  }, []);

  // Salva automaticamente la sessione quando cambiano i dati
  useEffect(() => {
    salvaSessione();
  }, [nomeSquadra, fontSelezionato, dimensioneFontSquadra, giocatoriSelezionati, coloreBackground]);

  // Precarica l'immagine quando cambiano i dati (ottimizzazione per iPhone)
  useEffect(() => {
    if (!loadingSessione && giocatoriSelezionati.length > 0) {
      // Debounce per evitare precaricamenti eccessivi
      const timeoutId = setTimeout(() => {
        preloadImmagine();
      }, 500); // Aspetta 500ms dopo l'ultimo cambiamento

      return () => clearTimeout(timeoutId);
    }
  }, [nomeSquadra, fontSelezionato, dimensioneFontSquadra, giocatoriSelezionati, loadingSessione]);

  // Calcola le statistiche delle foto disponibili
  const calcolaStatisticheFoto = async (giocatori: GiocatoreExcel[]) => {
    try {
      const controlliParalleli = giocatori.map(async (giocatore) => {
        try {
          const response = await fetch(
            `/api/check-player-image?cognome=${encodeURIComponent(giocatore.cognome)}&squadra=${encodeURIComponent(giocatore.squadra)}`
          );
          const imageData = await response.json();
          return imageData.exists;
        } catch (error) {
          return false;
        }
      });

      const risultati = await Promise.all(controlliParalleli);
      const conFoto = risultati.filter(Boolean).length;
      const totale = giocatori.length;

      setStatisticheFoto({ conFoto, totale });
    } catch (error) {
      console.error('Errore nel calcolare le statistiche foto:', error);
    }
  };



  // Funzione di precaricamento ottimizzata per iPhone
  const preloadImmagine = async () => {
    if (isPreloading || giocatoriSelezionati.length === 0) return;
    
    setIsPreloading(true);
    try {
      const canvas = await downloadImmagine();
      if (canvas) {
        setPreloadedCanvas(canvas);
      }
    } catch (error) {
      console.warn('Errore durante il precaricamento:', error);
    } finally {
      setIsPreloading(false);
    }
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
        ctx.font = `bold ${dimensioneFontSquadra}px ${getFontName(fontSelezionato)}, sans-serif`;
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

      // Disegna la scritta fantacover.it centrata
      ctx.fillStyle = 'white';
      ctx.font = `bold 69px "Leckerli One", cursive`; // Aumentato del 15% (60 * 1.15 = 69)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      
      // Salva il contesto per la rotazione
      ctx.save();
      ctx.translate(540, 1860); // Abbassato di 70px (1790 + 70 = 1860)
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
            const size = 400; // Dimensione target per tutti i giocatori
            
            // Calcola le dimensioni per mantenere l'aspect ratio
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            
            // Scala tutti i giocatori alla stessa dimensione (riempie l'area)
            const scale = Math.max(size / imgWidth, size / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Posiziona l'immagine: centrata orizzontalmente, allineata in alto verticalmente
            const imgX = x + (size - scaledWidth) / 2;
            const imgY = y; // Allinea in alto invece di centrare
            
            // Salva il contesto per il clipping
            ctx.save();
            
            // Crea un percorso per il clipping: rettangolo sopra + semicerchio sotto
            ctx.beginPath();
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const radius = size / 2;
            
            // Disegna la parte superiore (rettangolo)
            ctx.rect(x, y, size, size / 2);
            
            // Disegna la parte inferiore (semicerchio)
            ctx.arc(centerX, centerY, radius, 0, Math.PI); // Solo la metà inferiore del cerchio
            
            // Applica il clipping
            ctx.clip();
            
            // Disegna l'immagine con il clipping applicato
            ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
            
            // Ripristina il contesto
            ctx.restore();
            
            resolve();
          };
          
          img.onerror = () => {
            console.warn(`Impossibile caricare: ${giocatore.nome}`);
            // Disegna una forma colorata come fallback (rettangolo sopra + semicerchio sotto)
            const x = giocatore.x - 200;
            const y = giocatore.y - 200;
            const size = 400;
            
            const color = 
              giocatore.ruolo === 'portieri' ? '#10b981' :
              giocatore.ruolo === 'difensori' ? '#3b82f6' :
              giocatore.ruolo === 'centrocampisti' ? '#f59e0b' : '#ef4444';
            
            // Disegna la stessa forma del clipping: rettangolo sopra + semicerchio sotto
            ctx.fillStyle = color;
            ctx.beginPath();
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const radius = size / 2;
            
            // Disegna la parte superiore (rettangolo)
            ctx.rect(x, y, size, size / 2);
            
            // Disegna la parte inferiore (semicerchio)
            ctx.arc(centerX, centerY, radius, 0, Math.PI);
            
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
    setLoadingDownload(true);
    
    try {
      // Usa il canvas precaricato se disponibile, altrimenti genera al volo
      const canvas = preloadedCanvas || await downloadImmagine();
      
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
          setLoadingDownload(false);
        }, 'image/png');
      } else {
        setLoadingDownload(false);
      }
    } catch (error) {
      console.error('Errore durante il download:', error);
      setLoadingDownload(false);
    }
  };



  // Funzione di condivisione unificata per mobile
  const condividiMobile = async () => {
    setLoadingDownload(true);
    
    try {
      // Usa il canvas precaricato se disponibile per performance ottimale su iPhone
      const canvas = preloadedCanvas || await downloadImmagine();
      
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `fantacover-${Date.now()}.png`, { type: 'image/png' });
            
            // Ferma il loading prima di mostrare l'API di condivisione
            setLoadingDownload(false);
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: 'La mia Fantacover',
                  text: 'Guarda la mia formazione creata con Fantacover! 🏆⚽',
                  files: [file]
                });
              } catch (error) {
                // L'utente ha annullato la condivisione o c'è stato un errore
                console.log('Condivisione annullata o errore:', error);
              }
            } else {
              // Fallback: scarica l'immagine
              scaricaImmagine();
            }
          } else {
            setLoadingDownload(false);
          }
        }, 'image/png');
      } else {
        setLoadingDownload(false);
      }
    } catch (error) {
      console.error('Errore durante la condivisione:', error);
      setLoadingDownload(false);
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
      {/* Overlay di caricamento sessione */}
      {loadingSessione && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Caricamento in corso...</h3>
            <p className="text-gray-600 text-center">Ripristino della tua formazione salvata</p>
          </div>
        </div>
      )}

      {/* Overlay di caricamento download/condivisione */}
      {loadingDownload && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Preparazione immagine...</h3>
            <p className="text-gray-600 text-center">
              {isMobile 
                ? 'Stiamo preparando la tua immagine per la condivisione' 
                : 'Stiamo preparando la tua immagine per il download'
              }
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenuto principale - nascosto durante caricamento sessione */}
      {!loadingSessione && (
        <>
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
            placeholder="Inserisci il nome della tua squadra!"
            className="border border-gray-300 rounded-lg text-center font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none text-sm"
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
              minWidth: '320px',
              width: 'auto',
              maxWidth: 'none'
            }}
            maxLength={50}
            rows={2}
          />
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dimensione:</label>
            <input
              type="range"
              min="24"
              max="150"
              value={dimensioneFontSquadra}
              onChange={(e) => setDimensioneFontSquadra(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-right">{dimensioneFontSquadra}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Font:</label>
            <select
              value={fontSelezionato}
              onChange={(e) => setFontSelezionato(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fontDisponibili.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.nome}
                </option>
              ))}
            </select>
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
              disabled={loadingDownload}
              className={`px-6 py-3 font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2 ${
                loadingDownload 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loadingDownload ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Condividi
                  {preloadedCanvas && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1" title="Immagine precaricata - condivisione rapida!"></div>
                  )}
                </>
              )}
            </button>
          ) : (
            // Interfaccia desktop: solo bottone scarica
            <button
              onClick={scaricaImmagine}
              disabled={loadingDownload}
              className={`px-6 py-3 font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2 ${
                loadingDownload 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loadingDownload ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Scarica Immagine
                  {preloadedCanvas && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1" title="Immagine precaricata - download rapido!"></div>
                  )}
                </>
              )}
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
              className={`absolute text-center font-bold text-white flex items-center justify-center ${getFontClass(fontSelezionato)}`}
              style={{
                left: (540 - 400) * canvasScale,
                top: (120) * canvasScale,
                width: `${800 * canvasScale}px`,
                height: `${200 * canvasScale}px`,
                fontSize: `${dimensioneFontSquadra * canvasScale}px`,
                textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                zIndex: 45,
                lineHeight: '1.1',
                whiteSpace: 'pre-line',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {nomeSquadra}
            </div>
          )}

          {/* Scritta fantacover.it centrata */}
          <div
            className={`absolute text-white font-bold transform -rotate-2 ${leckerliOne.className}`}
            style={{
              left: `${540 * canvasScale}px`,
              bottom: `${60 * canvasScale}px`, // Abbassato di 70px (130 - 70 = 60)
              fontSize: `${69 * canvasScale}px`, // Aumentato del 15% (60 * 1.15 = 69)
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              zIndex: 70,
              transform: `translateX(-50%) rotate(-2deg)` // Centra il testo
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
                const coloriRuolo = getColoriRuolo(giocatoreInPosizione.ruolo);
                
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
                    <div 
                      className="relative w-full h-full overflow-hidden"
                      style={{
                        borderRadius: '0 0 50% 50%'
                      }}
                    >
                      <PlayerImage
                        squadra={giocatoreInPosizione.squadra}
                        nome={giocatoreInPosizione.nome}
                        alt={giocatoreInPosizione.nome}
                        width={400 * canvasScale}
                        height={400 * canvasScale}
                        className="object-cover object-top w-full h-full transition-all duration-200"
                      />
                    </div>
                    
                    {/* Bordo circolare per pre-delete */}
                    {isPreDelete && (
                      <>
                        <div
                          className="absolute border-4 border-white rounded-full pointer-events-none"
                          style={{
                            left: `${-30 * canvasScale}px`,
                            top: `${-30 * canvasScale}px`,
                            width: `${460 * canvasScale}px`,
                            height: `${460 * canvasScale}px`,
                            zIndex: 10000
                          }}
                        />
                        
                        {/* Pulsante di eliminazione */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rimuoviGiocatore(giocatoreInPosizione.id);
                          }}
                          className="absolute bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold transition-colors duration-200 shadow-xl border-4 border-white"
                          style={{
                            // Posizionamento tangente al bordo circolare a 45° (angolo superiore destro)
                            // Centro giocatore: (200, 200), raggio bordo: 230px, bottone: 60px
                            top: `${(200 - Math.cos(Math.PI/4) * 230 - 30) * canvasScale}px`,
                            right: `${(200 - Math.cos(Math.PI/4) * 230 - 30) * canvasScale}px`,
                            fontSize: `${24 * canvasScale}px`,
                            width: `${60 * canvasScale}px`,
                            height: `${60 * canvasScale}px`,
                            zIndex: 10001
                          }}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                );
              } else {
                // Mostra il cerchio con lettera ruolo
                const coloriRuolo = getColoriRuolo(ruolo as Ruolo);
                return (
                  <div
                    key={`${ruolo}-${index}`}
                    className={`absolute cursor-pointer flex items-center justify-center ${coloriRuolo.bg} border-2 ${coloriRuolo.borderCanvas} rounded-full hover:bg-opacity-100 transition-all`}
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
                    <span className={`${coloriRuolo.text} text-4xl font-bold`} style={{ fontSize: `${36 * canvasScale}px` }}>
                      {getLetteraRuolo(ruolo)}
                    </span>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Statistiche foto */}
      <div className="text-center mt-6 mb-8">
        {statisticheFoto ? (
          <div className="text-white">
            <p className="text-lg font-semibold mb-2">
              Abbiamo le foto di <span className="text-green-400">{statisticheFoto.conFoto}</span> giocatori su <span className="text-blue-400">{statisticheFoto.totale}</span>!
            </p>
            <p className="text-gray-300 text-sm">
              Aiutaci a trovare le foto di tutti i calciatori!
            </p>
          </div>
        ) : (
          <div className="text-gray-400">
            <p className="text-sm">Caricamento statistiche...</p>
          </div>
        )}
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
                    disabled={loadingExcel}
                    className={`p-3 rounded border text-sm flex items-center gap-3 transition-colors ${
                      loadingExcel 
                        ? 'border-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'hover:bg-gray-800 border-gray-600 hover:border-gray-500 text-white'
                    }`}
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
                      key={giocatore.nome}
                      onClick={() => (giocatore.hasFoto && !giocatore.giaSelezionato) ? aggiungiGiocatore(giocatore.nome) : undefined}
                      disabled={!giocatore.hasFoto || giocatore.giaSelezionato}
                      className={`p-3 text-left rounded border-2 transition-colors flex items-center justify-between ${
                        !giocatore.hasFoto 
                          ? 'border-gray-600 text-gray-500 cursor-not-allowed bg-gray-800' 
                          : giocatore.giaSelezionato
                          ? 'border-yellow-600 text-yellow-400 cursor-not-allowed bg-yellow-900 bg-opacity-20'
                          : (() => {
                              const colori = getColoriRuolo(ruoloSelezionato!);
                              return `hover:bg-gray-800 text-white ${colori.border} ${colori.hover}`;
                            })()
                      }`}
                    >
                      <span>{toTitleCase(giocatore.nome)}</span>
                      <div className="flex items-center gap-2">
                        {!giocatore.hasFoto && (
                          <span className="text-red-400 text-lg" title="Foto mancante">📷❌</span>
                        )}
                        {giocatore.giaSelezionato && (
                          <span className="text-yellow-400 text-lg" title="Giocatore già utilizzato">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {giocatoriSquadra.length === 0 && (
                    <p className="text-gray-400 text-center py-4">
                      {loadingExcel ? 'Caricamento dati...' : 'Nessun giocatore trovato per questo ruolo'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
