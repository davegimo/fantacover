# Configurazione Supabase per FantaCover

## 1. Creazione del progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Prendi nota dell'URL del progetto e della Service Role Key

## 2. Creazione della tabella

Esegui questa query SQL nel SQL Editor di Supabase:

```sql
-- Tabella per registrare le visite degli utenti
CREATE TABLE user_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- ID univoco generato lato client
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  url_domain TEXT NOT NULL, -- dominio dell'URL (localhost, fantacover.it, etc.)
  full_url TEXT, -- URL completo per debug
  user_agent TEXT, -- browser e sistema operativo
  referrer TEXT, -- da dove proviene l'utente
  screen_resolution TEXT, -- risoluzione dello schermo
  timezone TEXT, -- fuso orario dell'utente
  language TEXT, -- lingua del browser
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per ottimizzare le query per user_id
CREATE INDEX idx_user_visits_user_id ON user_visits(user_id);

-- Indice per query temporali
CREATE INDEX idx_user_visits_created_at ON user_visits(created_at);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_visits_updated_at 
    BEFORE UPDATE ON user_visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## 3. Configurazione delle variabili d'ambiente

Crea un file `.env.local` nella root del progetto con:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Permessi RLS (Row Level Security)

Nella dashboard di Supabase, vai su Authentication > Policies e crea una policy per permettere l'inserimento:

```sql
-- Abilita RLS
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- Policy per permettere inserimenti (solo per l'API)
CREATE POLICY "Enable insert for authenticated users only" ON user_visits
    FOR INSERT WITH CHECK (true);

-- Policy per permettere letture (solo per l'API)
CREATE POLICY "Enable read for authenticated users only" ON user_visits
    FOR SELECT USING (true);

-- Policy per permettere aggiornamenti (solo per l'API)
CREATE POLICY "Enable update for authenticated users only" ON user_visits
    FOR UPDATE USING (true);
```

## 5. Funzionalità implementate

### Tracking automatico
- Registrazione automatica al primo accesso
- Aggiornamento del contatore visite per utenti esistenti
- Raccolta di dati utili come:
  - Dominio dell'URL
  - User Agent
  - Risoluzione schermo
  - Fuso orario
  - Lingua del browser
  - Referrer

### Dati raccolti
- **user_id**: ID univoco generato lato client
- **first_visit_at**: Prima visita
- **last_visit_at**: Ultima visita
- **visit_count**: Numero di visite
- **url_domain**: Dominio dell'URL
- **full_url**: URL completo
- **user_agent**: Browser e sistema operativo
- **referrer**: Da dove proviene l'utente
- **screen_resolution**: Risoluzione dello schermo
- **timezone**: Fuso orario
- **language**: Lingua del browser

## 6. Query utili per l'analisi

```sql
-- Conta utenti unici per giorno
SELECT 
  DATE(first_visit_at) as data,
  COUNT(*) as nuovi_utenti
FROM user_visits 
GROUP BY DATE(first_visit_at)
ORDER BY data DESC;

-- Top domini di accesso
SELECT 
  url_domain,
  COUNT(*) as visite
FROM user_visits 
GROUP BY url_domain
ORDER BY visite DESC;

-- Utenti più attivi
SELECT 
  user_id,
  visit_count,
  first_visit_at,
  last_visit_at
FROM user_visits 
ORDER BY visit_count DESC
LIMIT 10;
```
