// Utility per il tracking dei download e condivisioni

// Genera un ID di sessione
export function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  const existingSessionId = sessionStorage.getItem('fantacover_session_id');
  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('fantacover_session_id', newSessionId);
  return newSessionId;
}

// Ottieni l'ID utente dal localStorage
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server_user';
  }
  return localStorage.getItem('fantacover_user_id') || 'unknown_user';
}

// Determina il tipo di dispositivo
export function getDeviceType(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent;
  
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  return 'desktop';
}

// Rileva se il dispositivo supporta la Web Share API
export function supportsWebShare(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'share' in navigator && 'canShare' in navigator;
}

// Rileva se il dispositivo supporta la navigator.clipboard
export function supportsClipboard(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'clipboard' in navigator && 'writeText' in navigator.clipboard;
}

// Registra un download
export async function trackDownload(options: {
  fileFormat?: string;
  fileSize?: number;
  imageDimensions?: string;
  metadata?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = {
      userId: getUserId(),
      sessionId: generateSessionId(),
      actionType: 'download',
      fileFormat: options.fileFormat,
      fileSize: options.fileSize,
      imageDimensions: options.imageDimensions,
      metadata: options.metadata
    };

    const response = await fetch('/api/download-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore nel tracking download:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nel tracking download:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

// Registra una condivisione
export async function trackShare(options: {
  platform: string; // 'whatsapp', 'instagram', 'facebook', 'twitter', 'email', 'link'
  method: string; // 'api', 'native', 'manual'
  fileFormat?: string;
  fileSize?: number;
  imageDimensions?: string;
  metadata?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = {
      userId: getUserId(),
      sessionId: generateSessionId(),
      actionType: `share_${options.platform}`,
      fileFormat: options.fileFormat,
      fileSize: options.fileSize,
      imageDimensions: options.imageDimensions,
      sharePlatform: options.platform,
      shareMethod: options.method,
      metadata: options.metadata
    };

    const response = await fetch('/api/download-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore nel tracking condivisione:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nel tracking condivisione:', error);
    return { success: false, error: 'Errore di rete' };
  }
}

// Funzione per condividere tramite Web Share API
export async function shareViaWebAPI(data: {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}): Promise<{ success: boolean; error?: string }> {
  if (!supportsWebShare()) {
    return { success: false, error: 'Web Share API non supportata' };
  }

  try {
    const shareData: any = {
      title: data.title,
      text: data.text,
    };

    if (data.url) {
      shareData.url = data.url;
    }

    if (data.files && data.files.length > 0) {
      shareData.files = data.files;
    }

    await navigator.share(shareData);

    // Traccia la condivisione
    await trackShare({
      platform: 'web_share',
      method: 'api',
      metadata: { title: data.title, text: data.text }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione Web API:', error);
    return { success: false, error: 'Errore nella condivisione' };
  }
}

// Funzione per copiare link negli appunti
export async function copyToClipboard(text: string): Promise<{ success: boolean; error?: string }> {
  if (!supportsClipboard()) {
    return { success: false, error: 'Clipboard API non supportata' };
  }

  try {
    await navigator.clipboard.writeText(text);

    // Traccia la copia
    await trackShare({
      platform: 'clipboard',
      method: 'api',
      metadata: { textLength: text.length }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella copia negli appunti:', error);
    return { success: false, error: 'Errore nella copia' };
  }
}

// Funzione per condividere su WhatsApp
export function shareViaWhatsApp(text: string, url?: string): { success: boolean; error?: string } {
  try {
    const shareText = url ? `${text} ${url}` : text;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    
    window.open(whatsappUrl, '_blank');

    // Traccia la condivisione
    trackShare({
      platform: 'whatsapp',
      method: 'manual',
      metadata: { textLength: text.length, hasUrl: !!url }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione WhatsApp:', error);
    return { success: false, error: 'Errore nella condivisione WhatsApp' };
  }
}

// Funzione per condividere su Instagram
export function shareViaInstagram(url?: string): { success: boolean; error?: string } {
  try {
    // Instagram non ha un'API diretta per la condivisione, 
    // ma possiamo aprire l'app o il sito
    const instagramUrl = url ? `https://www.instagram.com/?url=${encodeURIComponent(url)}` : 'https://www.instagram.com/';
    
    window.open(instagramUrl, '_blank');

    // Traccia la condivisione
    trackShare({
      platform: 'instagram',
      method: 'manual',
      metadata: { hasUrl: !!url }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione Instagram:', error);
    return { success: false, error: 'Errore nella condivisione Instagram' };
  }
}

// Funzione per condividere su Facebook
export function shareViaFacebook(url: string): { success: boolean; error?: string } {
  try {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    
    window.open(facebookUrl, '_blank');

    // Traccia la condivisione
    trackShare({
      platform: 'facebook',
      method: 'manual',
      metadata: { url }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione Facebook:', error);
    return { success: false, error: 'Errore nella condivisione Facebook' };
  }
}

// Funzione per condividere su Twitter/X
export function shareViaTwitter(text: string, url?: string): { success: boolean; error?: string } {
  try {
    const shareText = url ? `${text} ${url}` : text;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    
    window.open(twitterUrl, '_blank');

    // Traccia la condivisione
    trackShare({
      platform: 'twitter',
      method: 'manual',
      metadata: { textLength: text.length, hasUrl: !!url }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione Twitter:', error);
    return { success: false, error: 'Errore nella condivisione Twitter' };
  }
}

// Funzione per condividere via email
export function shareViaEmail(subject: string, body: string): { success: boolean; error?: string } {
  try {
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = emailUrl;

    // Traccia la condivisione
    trackShare({
      platform: 'email',
      method: 'manual',
      metadata: { subject, bodyLength: body.length }
    });

    return { success: true };
  } catch (error) {
    console.error('Errore nella condivisione email:', error);
    return { success: false, error: 'Errore nella condivisione email' };
  }
}
