// Utility per il tracking degli utenti

// Genera un ID univoco per l'utente
export function generateUserId(): string {
  // Controlla se localStorage è disponibile (solo lato client)
  if (typeof window === 'undefined') {
    return 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Se esiste già un ID nel localStorage, lo riutilizza
  const existingId = localStorage.getItem('fantacover_user_id');
  if (existingId) {
    return existingId;
  }

  // Altrimenti genera un nuovo ID
  const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('fantacover_user_id', newId);
  return newId;
}

// Estrae il dominio dall'URL
export function getUrlDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

// Raccoglie i dati dell'utente
export function collectUserData() {
  // Controlla se siamo lato client
  if (typeof window === 'undefined') {
    return {
      userId: generateUserId(),
      urlDomain: 'unknown',
      fullUrl: 'unknown',
      userAgent: 'server',
      referrer: null,
      screenResolution: 'unknown',
      timezone: 'UTC',
      language: 'unknown'
    };
  }

  return {
    userId: generateUserId(),
    urlDomain: getUrlDomain(window.location.href),
    fullUrl: window.location.href,
    userAgent: navigator.userAgent,
    referrer: document.referrer || null,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
}

// Registra la visita dell'utente
export async function registerUserVisit(): Promise<{ success: boolean; isNewUser?: boolean; error?: string }> {
  try {
    const userData = collectUserData();
    
    const response = await fetch('/api/user-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore nella registrazione visita:', result.error);
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      isNewUser: result.isNewUser 
    };
  } catch (error) {
    console.error('Errore nella registrazione visita:', error);
    return { 
      success: false, 
      error: 'Errore di rete' 
    };
  }
}

// Controlla se è il primo accesso dell'utente
export function isFirstVisit(): boolean {
  if (typeof window === 'undefined') {
    return false; // Lato server, non possiamo determinare
  }
  return !localStorage.getItem('fantacover_user_id');
}
