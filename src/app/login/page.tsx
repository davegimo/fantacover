'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leckerli_One } from 'next/font/google';

const leckerliOne = Leckerli_One({
  weight: '400',
  subsets: ['latin'],
});

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password === 'fabiodavide') {
      // Imposta il cookie di autenticazione
      document.cookie = 'auth=fabiodavide; path=/; max-age=86400'; // 24 ore
      router.push('/');
    } else {
      setError('Password non corretta');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ 
        backgroundColor: '#1A1414',
        backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundRepeat: 'repeat'
      }}
    >
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className={`text-4xl font-bold text-white mb-2 transform -rotate-2 ${leckerliOne.className}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            FantaCover
          </h1>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            🔒 Accesso Protetto
          </h2>
          <p className="mt-2 text-sm text-white text-opacity-90">
            Inserisci la password per accedere al sito
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Accedi'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-white text-opacity-70 mt-8">
          <p>🔐 Sito temporaneamente protetto</p>
          <p>Contatta l'amministratore per l'accesso</p>
        </div>
      </div>
    </div>
  );
}
