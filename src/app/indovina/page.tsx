'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

// Interfaccia per i giocatori
interface Giocatore {
  nome: string;
  squadra: string;
  ruolo: string;
  immagine: string;
}

export default function IndovinaPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [giocatori, setGiocatori] = useState<Giocatore[]>([]);
  const [giocatoreCorrente, setGiocatoreCorrente] = useState<Giocatore | null>(null);
  const [tentativi, setTentativi] = useState(6);
  const [pixelRivelati, setPixelRivelati] = useState(0);
  const [rispostaUtente, setRispostaUtente] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [vittorie, setVittorie] = useState(0);
  const [partite, setPartite] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const PASSWORD_CORRETTA = 'fantacover2024';

  // Carica i giocatori disponibili
  useEffect(() => {
    const caricaGiocatori = async () => {
      try {
        const response = await fetch('/api/excel-data');
        const data = await response.json();
        
        // Filtra solo i giocatori con foto
        const giocatoriConFoto = data.filter((giocatore: any) => {
          const nomeFile = giocatore.cognome.replace(/\s+/g, '').toLowerCase();
          return giocatore.hasFoto;
        });

        setGiocatori(giocatoriConFoto);
      } catch (error) {
        console.error('Errore nel caricamento giocatori:', error);
      }
    };

    if (isAuthenticated) {
      caricaGiocatori();
    }
  }, [isAuthenticated]);

  // Inizia una nuova partita
  const iniziaNuovaPartita = () => {
    if (giocatori.length === 0) return;
    
    const giocatoreCasuale = giocatori[Math.floor(Math.random() * giocatori.length)];
    setGiocatoreCorrente(giocatoreCasuale);
    setTentativi(6);
    setPixelRivelati(0);
    setRispostaUtente('');
    setMessaggio('');
    setGameOver(false);
    setPartite(prev => prev + 1);
  };

  // Gestisce l'autenticazione
  const handleLogin = () => {
    if (password === PASSWORD_CORRETTA) {
      setIsAuthenticated(true);
    } else {
      setMessaggio('Password errata!');
    }
  };

  // Gestisce la risposta dell'utente
  const handleRisposta = () => {
    if (!giocatoreCorrente || rispostaUtente.trim() === '') return;

    const rispostaCorretta = giocatoreCorrente.cognome.toLowerCase();
    const rispostaUtenteLower = rispostaUtente.toLowerCase();

    if (rispostaUtenteLower === rispostaCorretta) {
      setMessaggio('🎉 Corretto! Hai indovinato!');
      setVittorie(prev => prev + 1);
      setGameOver(true);
    } else {
      const nuoviTentativi = tentativi - 1;
      setTentativi(nuoviTentativi);
      
      if (nuoviTentativi === 0) {
        setMessaggio(`❌ Game Over! Il giocatore era ${giocatoreCorrente.cognome}`);
        setGameOver(true);
      } else {
        setMessaggio(`❌ Sbagliato! Hai ancora ${nuoviTentativi} tentativi`);
        setPixelRivelati(prev => prev + 1);
      }
    }
    
    setRispostaUtente('');
  };

  // Gestisce il tasto Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRisposta();
    }
  };

  // Disegna l'immagine con pixel rivelati
  useEffect(() => {
    if (!giocatoreCorrente || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 400;
      
      // Disegna l'immagine sfocata di base
      ctx.filter = 'blur(20px)';
      ctx.drawImage(img, 0, 0, 300, 400);
      
      // Calcola quanti pixel rivelare
      const pixelTotali = 300 * 400;
      const pixelDaRivelare = Math.floor((pixelTotali * (pixelRivelati + 1)) / 6);
      
      // Riveliamo pixel casuali
      ctx.filter = 'none';
      for (let i = 0; i < pixelDaRivelare; i++) {
        const x = Math.floor(Math.random() * 300);
        const y = Math.floor(Math.random() * 400);
        
        // Disegna un piccolo quadrato del pixel originale
        ctx.drawImage(img, x, y, 1, 1, x, y, 1, 1);
      }
    };
    
    img.src = `/giocatori2/${giocatoreCorrente.squadra}/${giocatoreCorrente.cognome}.webp`;
  }, [giocatoreCorrente, pixelRivelati]);

  // Se non autenticato, mostra il form di login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white text-center mb-6">
            🔐 Indovina il Giocatore
          </h1>
          <p className="text-white/80 text-center mb-6">
            Inserisci la password per accedere al gioco
          </p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Accedi
            </button>
            
            {messaggio && (
              <p className="text-red-400 text-center text-sm">{messaggio}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Navigation />
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Indovina il Giocatore
          </h1>
          <div className="flex justify-center items-center gap-8 text-white/80">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2">
              <span className="text-sm">Partite: {partite}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2">
              <span className="text-sm">Vittorie: {vittorie}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2">
              <span className="text-sm">Tentativi: {tentativi}</span>
            </div>
          </div>
        </div>

        {/* Area di gioco */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Immagine del giocatore */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-4">Chi è questo giocatore?</h2>
            
            {giocatoreCorrente ? (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-white/30 rounded-lg"
                  style={{ width: '300px', height: '400px' }}
                />
                <div className="mt-4 text-center">
                  <p className="text-white/80 text-sm">
                    Pixel rivelati: {Math.floor(((pixelRivelati + 1) / 6) * 100)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-300 h-400 bg-white/20 rounded-lg flex items-center justify-center">
                <p className="text-white/60">Clicca "Nuova Partita" per iniziare</p>
              </div>
            )}
          </div>

          {/* Controlli di gioco */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Indovina!</h2>
            
            {!gameOver && giocatoreCorrente ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={rispostaUtente}
                  onChange={(e) => setRispostaUtente(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Inserisci il cognome del giocatore..."
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                
                <button
                  onClick={handleRisposta}
                  disabled={!rispostaUtente.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Conferma Risposta
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={iniziaNuovaPartita}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Nuova Partita
                </button>
              </div>
            )}

            {/* Messaggio */}
            {messaggio && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg">
                <p className="text-white text-center font-semibold">{messaggio}</p>
              </div>
            )}

            {/* Statistiche */}
            {partite > 0 && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <h3 className="text-white font-bold mb-2">Statistiche</h3>
                <p className="text-white/80">
                  Percentuale vittorie: {Math.round((vittorie / partite) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
