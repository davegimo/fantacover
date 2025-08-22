# Sistema di Tracking Download e Condivisioni

## 📋 Panoramica

Il sistema traccia automaticamente tutti i download e le condivisioni degli utenti, registrando informazioni dettagliate su:
- **Utente**: ID univoco e sessione
- **Dispositivo**: Desktop, mobile o tablet
- **Azione**: Download o condivisione su piattaforme specifiche
- **Contesto**: URL, referrer, user agent, IP
- **File**: Formato, dimensione, risoluzione

## 🗄️ Struttura Database

### Tabella `downloads_tracking`
```sql
- id (UUID, Primary Key)
- user_id (VARCHAR) - ID utente univoco
- session_id (VARCHAR) - ID sessione
- download_timestamp (TIMESTAMP) - Data/ora del download
- device_type (VARCHAR) - 'desktop', 'mobile', 'tablet'
- action_type (VARCHAR) - 'download', 'share_whatsapp', 'share_instagram', etc.
- file_format (VARCHAR) - 'png', 'jpg', 'pdf'
- file_size (INTEGER) - Dimensione in bytes
- image_dimensions (VARCHAR) - '1920x1080'
- user_agent (TEXT) - Browser/dispositivo
- ip_address (INET) - IP dell'utente
- referrer (TEXT) - Pagina di provenienza
- url_path (VARCHAR) - Path della pagina corrente
- share_platform (VARCHAR) - Piattaforma di condivisione
- share_method (VARCHAR) - 'api', 'native', 'manual'
- success (BOOLEAN) - Se l'azione è riuscita
- error_message (TEXT) - Eventuale errore
- metadata (JSONB) - Dati aggiuntivi
- created_at (TIMESTAMP) - Data creazione record
```

### Tabella `downloads_stats` (Aggregazioni)
```sql
- id (UUID, Primary Key)
- date (DATE) - Data
- total_downloads (INTEGER) - Download totali
- total_shares (INTEGER) - Condivisioni totali
- downloads_by_device (JSONB) - Statistiche per dispositivo
- shares_by_platform (JSONB) - Statistiche per piattaforma
- unique_users (INTEGER) - Utenti unici
- created_at, updated_at (TIMESTAMP)
```

## 🚀 Setup

### 1. Creare le Tabelle in Supabase
Esegui lo script SQL in `SUPABASE_DOWNLOADS_TABLE.sql` nel tuo database Supabase.

### 2. Configurare le Variabili d'Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Testare la Configurazione
```bash
# Test generale Supabase
curl http://localhost:3000/api/test-supabase

# Test specifico downloads
curl http://localhost:3000/api/test-downloads
```

## 📱 Utilizzo

### Tracking Automatico dei Download
```typescript
import { trackDownload } from '../utils/downloadTracking';

// Traccia un download
await trackDownload({
  fileFormat: 'png',
  fileSize: 1024000,
  imageDimensions: '1920x1080',
  metadata: { title: 'Formazione FantaCover' }
});
```

### Tracking delle Condivisioni
```typescript
import { 
  shareViaWhatsApp, 
  shareViaInstagram, 
  shareViaFacebook,
  shareViaTwitter,
  shareViaEmail,
  copyToClipboard 
} from '../utils/downloadTracking';

// Condividi su WhatsApp
shareViaWhatsApp('Guarda la mia formazione!', 'https://example.com/image.png');

// Condividi su Instagram
shareViaInstagram('https://example.com/image.png');

// Condividi su Facebook
shareViaFacebook('https://example.com/image.png');

// Condividi su Twitter
shareViaTwitter('Guarda la mia formazione!', 'https://example.com/image.png');

// Condividi via Email
shareViaEmail('La mia formazione FantaCover', 'Guarda la mia formazione creata con FantaCover!');

// Copia link negli appunti
await copyToClipboard('https://example.com/image.png');
```

### Componente React Completo
```tsx
import ShareButtons from '../components/ShareButtons';

<ShareButtons
  imageUrl="https://example.com/formation.png"
  title="La mia formazione FantaCover"
  text="Guarda la mia formazione creata con FantaCover!"
  fileFormat="png"
  fileSize={1024000}
  imageDimensions="1920x1080"
  onDownload={() => console.log('Download completato')}
  onShare={(platform) => console.log(`Condiviso su ${platform}`)}
/>
```

## 🔍 Query di Analisi

### Download per Giorno
```sql
SELECT 
  DATE(download_timestamp) as date,
  COUNT(*) as downloads,
  COUNT(DISTINCT user_id) as unique_users
FROM downloads_tracking 
WHERE action_type = 'download'
GROUP BY DATE(download_timestamp)
ORDER BY date DESC;
```

### Condivisioni per Piattaforma
```sql
SELECT 
  share_platform,
  COUNT(*) as shares,
  COUNT(DISTINCT user_id) as unique_users
FROM downloads_tracking 
WHERE action_type LIKE 'share_%'
GROUP BY share_platform
ORDER BY shares DESC;
```

### Dispositivi più Utilizzati
```sql
SELECT 
  device_type,
  COUNT(*) as actions,
  COUNT(DISTINCT user_id) as unique_users
FROM downloads_tracking 
GROUP BY device_type
ORDER BY actions DESC;
```

### Utenti più Attivi
```sql
SELECT 
  user_id,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action_type = 'download' THEN 1 END) as downloads,
  COUNT(CASE WHEN action_type LIKE 'share_%' THEN 1 END) as shares
FROM downloads_tracking 
GROUP BY user_id
ORDER BY total_actions DESC
LIMIT 10;
```

## 📊 API Endpoints

### POST `/api/download-tracking`
Registra un download o condivisione.

**Body:**
```json
{
  "userId": "user_123",
  "sessionId": "session_456",
  "actionType": "download",
  "fileFormat": "png",
  "fileSize": 1024000,
  "imageDimensions": "1920x1080",
  "sharePlatform": null,
  "shareMethod": null,
  "metadata": { "title": "Formazione" }
}
```

### GET `/api/download-tracking`
Recupera statistiche (solo admin).

**Query Parameters:**
- `date`: Filtra per data (YYYY-MM-DD)
- `actionType`: Filtra per tipo di azione

## 🎨 Personalizzazione

### Stili CSS
I pulsanti di condivisione sono stilizzati in `globals.css` con:
- Gradienti colorati per ogni piattaforma
- Animazioni hover e click
- Design responsive
- Icone SVG integrate

### Piattaforme Supportate
- **Download**: Salvataggio locale
- **Web Share API**: Condivisione nativa (mobile)
- **WhatsApp**: Link diretto
- **Instagram**: Apertura app/sito
- **Facebook**: Condivisione URL
- **Twitter**: Tweet con testo
- **Email**: Mailto link
- **Clipboard**: Copia negli appunti

## 🔧 Manutenzione

### Pulizia Dati
```sql
-- Elimina record più vecchi di 1 anno
DELETE FROM downloads_tracking 
WHERE download_timestamp < NOW() - INTERVAL '1 year';

-- Elimina statistiche più vecchie di 6 mesi
DELETE FROM downloads_stats 
WHERE date < CURRENT_DATE - INTERVAL '6 months';
```

### Backup
```sql
-- Backup giornaliero delle statistiche
CREATE TABLE downloads_stats_backup AS 
SELECT * FROM downloads_stats 
WHERE date = CURRENT_DATE - INTERVAL '1 day';
```

## 🚨 Troubleshooting

### Errori Comuni
1. **"Variabili d'ambiente non configurate"**: Verifica `.env.local`
2. **"Tabella non trovata"**: Esegui lo script SQL
3. **"Errore di connessione"**: Verifica URL e chiave Supabase
4. **"localStorage non disponibile"**: Controlla se sei lato server

### Debug
```typescript
// Abilita log dettagliati
console.log('User ID:', getUserId());
console.log('Session ID:', generateSessionId());
console.log('Device Type:', getDeviceType());
console.log('Web Share Support:', supportsWebShare());
console.log('Clipboard Support:', supportsClipboard());
```

## 📈 Metriche Importanti

- **Tasso di conversione**: Download / Visite
- **Piattaforme preferite**: Condivisioni per social
- **Dispositivi**: Desktop vs Mobile
- **Orari di picco**: Quando gli utenti scaricano
- **Utenti ricorrenti**: Chi scarica più volte
- **Viralità**: Condivisioni per download
