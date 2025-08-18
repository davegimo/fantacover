'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface GiocatoreExcel {
  ruolo: string;
  cognome: string;
  squadra: string;
}

interface GiocatoreConImmagine extends GiocatoreExcel {
  hasImage: boolean;
  imagePath: string | null;
}

interface Statistiche {
  totaleGiocatori: number;
  conImmagine: number;
  senzaImmagine: number;
  percentualeCompleta: number;
  perRuolo: {
    [key: string]: {
      totale: number;
      conImmagine: number;
      senzaImmagine: number;
    };
  };
}

interface StatisticheSquadra {
  squadra: string;
  totaleGiocatori: number;
  conImmagine: number;
  senzaImmagine: number;
  percentualeCompleta: number;
}

export default function AdminPage() {
  const [giocatori, setGiocatori] = useState<GiocatoreExcel[]>([]);
  const [squadreDisponibili, setSquadreDisponibili] = useState<string[]>([]);
  const [squadraSelezionata, setSquadraSelezionata] = useState<string>('');
  const [giocatoriSquadra, setGiocatoriSquadra] = useState<GiocatoreConImmagine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImmagini, setLoadingImmagini] = useState(false);
  const [filtroRuolo, setFiltroRuolo] = useState<string>('');
  const [mostraSoloMancanti, setMostraSoloMancanti] = useState(false);
  const [statisticheGenerali, setStatisticheGenerali] = useState<StatisticheSquadra[]>([]);
  const [loadingStatisticheGenerali, setLoadingStatisticheGenerali] = useState(false);

  // Carica i dati dall'Excel all'avvio
  useEffect(() => {
    const caricaDatiExcel = async () => {
      try {
        const response = await fetch('/api/excel-data');
        const data: GiocatoreExcel[] = await response.json();
        
        setGiocatori(data);
        
        // Estrai le squadre uniche
        const squadreUniche = [...new Set(data.map(g => g.squadra))].sort();
        setSquadreDisponibili(squadreUniche);
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricare i dati:', error);
        setLoading(false);
      }
    };

    caricaDatiExcel();
  }, []);

  // Carica le statistiche generali quando non è selezionata alcuna squadra
  useEffect(() => {
    if (!squadraSelezionata && giocatori.length > 0 && squadreDisponibili.length > 0) {
      const caricaStatisticheGenerali = async () => {
        setLoadingStatisticheGenerali(true);
        
        const statistichePromises = squadreDisponibili.map(async (squadra) => {
          const giocatoriDellSquadra = giocatori.filter(g => g.squadra === squadra);
          
          // Controlla l'esistenza delle immagini per ogni giocatore
          const giocatoriConImmagini = await Promise.all(
            giocatoriDellSquadra.map(async (giocatore) => {
              try {
                const response = await fetch(
                  `/api/check-player-image?cognome=${encodeURIComponent(giocatore.cognome)}&squadra=${encodeURIComponent(giocatore.squadra)}`
                );
                const imageData = await response.json();
                
                return {
                  ...giocatore,
                  hasImage: imageData.exists,
                  imagePath: imageData.imagePath
                };
              } catch (error) {
                return {
                  ...giocatore,
                  hasImage: false,
                  imagePath: null
                };
              }
            })
          );

          const conImmagine = giocatoriConImmagini.filter(g => g.hasImage).length;
          const totaleGiocatori = giocatoriConImmagini.length;
          
          return {
            squadra,
            totaleGiocatori,
            conImmagine,
            senzaImmagine: totaleGiocatori - conImmagine,
            percentualeCompleta: totaleGiocatori > 0 ? Math.round((conImmagine / totaleGiocatori) * 100) : 0
          };
        });

        const risultati = await Promise.all(statistichePromises);
        risultati.sort((a, b) => b.percentualeCompleta - a.percentualeCompleta);
        setStatisticheGenerali(risultati);
        setLoadingStatisticheGenerali(false);
      };

      caricaStatisticheGenerali();
    }
  }, [squadraSelezionata, giocatori, squadreDisponibili]);

  // Carica i giocatori della squadra selezionata
  useEffect(() => {
    if (squadraSelezionata && giocatori.length > 0) {
      const caricaGiocatoriSquadra = async () => {
        setLoadingImmagini(true);
        
        // Filtra i giocatori della squadra selezionata
        const giocatoriDellSquadra = giocatori.filter(g => g.squadra === squadraSelezionata);
        
        // Controlla l'esistenza delle immagini per ogni giocatore
        const giocatoriConImmagini = await Promise.all(
          giocatoriDellSquadra.map(async (giocatore) => {
            try {
              const response = await fetch(
                `/api/check-player-image?cognome=${encodeURIComponent(giocatore.cognome)}&squadra=${encodeURIComponent(giocatore.squadra)}`
              );
              const imageData = await response.json();
              
              return {
                ...giocatore,
                hasImage: imageData.exists,
                imagePath: imageData.imagePath
              };
            } catch (error) {
              console.error(`Errore nel controllare l'immagine per ${giocatore.cognome}:`, error);
              return {
                ...giocatore,
                hasImage: false,
                imagePath: null
              };
            }
          })
        );
        
        // Ordina per ruolo e poi per cognome
        const ruoliOrdine = ['P', 'D', 'C', 'A'];
        giocatoriConImmagini.sort((a, b) => {
          const ordineA = ruoliOrdine.indexOf(a.ruolo);
          const ordineB = ruoliOrdine.indexOf(b.ruolo);
          
          if (ordineA !== ordineB) {
            return ordineA - ordineB;
          }
          
          return a.cognome.localeCompare(b.cognome);
        });
        
        setGiocatoriSquadra(giocatoriConImmagini);
        setLoadingImmagini(false);
      };

      caricaGiocatoriSquadra();
    }
  }, [squadraSelezionata, giocatori]);

  // Calcola le statistiche
  const statistiche: Statistiche = useMemo(() => {
    if (!giocatoriSquadra.length) {
      return {
        totaleGiocatori: 0,
        conImmagine: 0,
        senzaImmagine: 0,
        percentualeCompleta: 0,
        perRuolo: {}
      };
    }

    const stats: Statistiche = {
      totaleGiocatori: giocatoriSquadra.length,
      conImmagine: giocatoriSquadra.filter(g => g.hasImage).length,
      senzaImmagine: giocatoriSquadra.filter(g => !g.hasImage).length,
      percentualeCompleta: 0,
      perRuolo: {}
    };

    stats.percentualeCompleta = Math.round((stats.conImmagine / stats.totaleGiocatori) * 100);

    // Statistiche per ruolo
    const ruoli = ['P', 'D', 'C', 'A'];
    ruoli.forEach(ruolo => {
      const giocatoriRuolo = giocatoriSquadra.filter(g => g.ruolo === ruolo);
      stats.perRuolo[ruolo] = {
        totale: giocatoriRuolo.length,
        conImmagine: giocatoriRuolo.filter(g => g.hasImage).length,
        senzaImmagine: giocatoriRuolo.filter(g => !g.hasImage).length
      };
    });

    return stats;
  }, [giocatoriSquadra]);

  // Filtra i giocatori in base ai filtri attivi
  const giocatoriFiltrati = useMemo(() => {
    let filtrati = giocatoriSquadra;

    if (filtroRuolo) {
      filtrati = filtrati.filter(g => g.ruolo === filtroRuolo);
    }

    if (mostraSoloMancanti) {
      filtrati = filtrati.filter(g => !g.hasImage);
    }

    return filtrati;
  }, [giocatoriSquadra, filtroRuolo, mostraSoloMancanti]);

  // Calcola le statistiche totali per tutte le squadre
  const statisticheTotali = useMemo(() => {
    if (!statisticheGenerali.length) return null;

    const totaleGiocatori = statisticheGenerali.reduce((sum, s) => sum + s.totaleGiocatori, 0);
    const totaleConImmagine = statisticheGenerali.reduce((sum, s) => sum + s.conImmagine, 0);
    const totaleSenzaImmagine = statisticheGenerali.reduce((sum, s) => sum + s.senzaImmagine, 0);
    const percentualeCompletaMedia = Math.round((totaleConImmagine / totaleGiocatori) * 100);

    const squadreComplete = statisticheGenerali.filter(s => s.percentualeCompleta === 100).length;
    const squadreIncomplete = statisticheGenerali.length - squadreComplete;

    return {
      totaleSquadre: statisticheGenerali.length,
      totaleGiocatori,
      totaleConImmagine,
      totaleSenzaImmagine,
      percentualeCompletaMedia,
      squadreComplete,
      squadreIncomplete
    };
  }, [statisticheGenerali]);

  const getRuoloColor = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRuoloNome = (ruolo: string) => {
    switch (ruolo) {
      case 'P': return 'Portieri';
      case 'D': return 'Difensori';
      case 'C': return 'Centrocampisti';
      case 'A': return 'Attaccanti';
      default: return ruolo;
    }
  };

  const getPercentualeColor = (percentuale: number) => {
    if (percentuale === 100) return 'text-green-600 bg-green-50';
    if (percentuale >= 80) return 'text-blue-600 bg-blue-50';
    if (percentuale >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentuale >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati Excel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Amministrazione Giocatori
          </h1>
          
          {/* Selettore squadra */}
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Squadra
            </label>
            <select
              value={squadraSelezionata}
              onChange={(e) => {
                setSquadraSelezionata(e.target.value);
                setFiltroRuolo('');
                setMostraSoloMancanti(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Visualizza riepilogo generale --</option>
              {squadreDisponibili.map((squadra) => (
                <option key={squadra} value={squadra}>
                  {squadra}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista Riepilogo Generale */}
        {!squadraSelezionata && (
          <>
            {/* Statistiche Totali */}
            {statisticheTotali && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Squadre Totali</h3>
                  <div className="text-3xl font-bold text-blue-600">{statisticheTotali.totaleSquadre}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Squadre Complete</h3>
                  <div className="text-3xl font-bold text-green-600">{statisticheTotali.squadreComplete}</div>
                  <p className="text-sm text-gray-600 mt-2">100% immagini</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Squadre Incomplete</h3>
                  <div className="text-3xl font-bold text-red-600">{statisticheTotali.squadreIncomplete}</div>
                  <p className="text-sm text-gray-600 mt-2">Immagini mancanti</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Completezza Media</h3>
                  <div className="text-3xl font-bold text-purple-600">{statisticheTotali.percentualeCompletaMedia}%</div>
                  <p className="text-sm text-gray-600 mt-2">{statisticheTotali.totaleConImmagine}/{statisticheTotali.totaleGiocatori} giocatori</p>
                </div>
              </div>
            )}

            {/* Tabella Riepilogo Squadre */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Riepilogo per Squadra
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Stato completezza immagini per tutte le squadre
                </p>
              </div>

              {loadingStatisticheGenerali ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Caricamento statistiche...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Squadra
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Totale Giocatori
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Con Immagine
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Senza Immagine
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completezza
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statisticheGenerali.map((stat) => (
                        <tr key={stat.squadra} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{stat.squadra}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900">{stat.totaleGiocatori}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-green-600 font-medium">{stat.conImmagine}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-red-600 font-medium">{stat.senzaImmagine}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPercentualeColor(stat.percentualeCompleta)}`}>
                              {stat.percentualeCompleta}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSquadraSelezionata(stat.squadra)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Visualizza dettagli
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Vista Squadra Specifica (codice esistente) */}
        {squadraSelezionata && (
          <>
            {/* Statistiche */}
            {!loadingImmagini && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Statistiche generali */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Totale Giocatori</h3>
                  <div className="text-3xl font-bold text-blue-600">{statistiche.totaleGiocatori}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Con Immagine</h3>
                  <div className="text-3xl font-bold text-green-600">{statistiche.conImmagine}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Senza Immagine</h3>
                  <div className="text-3xl font-bold text-red-600">{statistiche.senzaImmagine}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Completezza</h3>
                  <div className="text-3xl font-bold text-purple-600">{statistiche.percentualeCompleta}%</div>
                </div>

                {/* Statistiche per ruolo */}
                {Object.entries(statistiche.perRuolo).map(([ruolo, stats]) => (
                  <div key={ruolo} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{getRuoloNome(ruolo)}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Totale:</span>
                        <span className="font-medium">{stats.totale}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Con img:</span>
                        <span className="font-medium text-green-600">{stats.conImmagine}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Senza img:</span>
                        <span className="font-medium text-red-600">{stats.senzaImmagine}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filtri */}
            {!loadingImmagini && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtra per Ruolo
                    </label>
                    <select
                      value={filtroRuolo}
                      onChange={(e) => setFiltroRuolo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Tutti i ruoli</option>
                      <option value="P">Portieri</option>
                      <option value="D">Difensori</option>
                      <option value="C">Centrocampisti</option>
                      <option value="A">Attaccanti</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mostraSoloMancanti}
                        onChange={(e) => setMostraSoloMancanti(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mostra solo immagini mancanti</span>
                    </label>
                  </div>

                  {(filtroRuolo || mostraSoloMancanti) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setFiltroRuolo('');
                          setMostraSoloMancanti(false);
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Rimuovi filtri
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabella giocatori */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Giocatori - {squadraSelezionata}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Mostrati: {giocatoriFiltrati.length} di {giocatoriSquadra.length} giocatori
                </p>
              </div>

              {loadingImmagini ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Controllo immagini...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ruolo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cognome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Immagine
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {giocatoriFiltrati.map((giocatore, index) => (
                        <tr key={`${giocatore.cognome}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRuoloColor(giocatore.ruolo)}`}>
                              {giocatore.ruolo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {giocatore.cognome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {giocatore.hasImage && giocatore.imagePath ? (
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                                  <Image
                                    src={giocatore.imagePath}
                                    alt={giocatore.cognome}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <span className="ml-2 text-sm text-green-600">✓ Presente</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-lg">✗</span>
                                </div>
                                <span className="ml-2 text-sm text-red-600">Mancante</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 