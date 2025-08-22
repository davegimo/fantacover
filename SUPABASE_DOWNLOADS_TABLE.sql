-- Tabella per tracciare i download e le condivisioni
CREATE TABLE IF NOT EXISTS downloads_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_type VARCHAR(50) NOT NULL, -- 'desktop', 'mobile', 'tablet'
  action_type VARCHAR(50) NOT NULL, -- 'download', 'share_whatsapp', 'share_instagram', 'share_facebook', 'share_twitter', 'share_email', 'share_link', 'copy_link'
  file_format VARCHAR(20), -- 'png', 'jpg', 'pdf', etc.
  file_size INTEGER, -- dimensione in bytes
  image_dimensions VARCHAR(20), -- '1920x1080', etc.
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  url_path VARCHAR(500),
  share_platform VARCHAR(100), -- piattaforma specifica per le condivisioni
  share_method VARCHAR(50), -- 'api', 'native', 'manual'
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB, -- dati aggiuntivi in formato JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_timestamp ON downloads_tracking(download_timestamp);
CREATE INDEX IF NOT EXISTS idx_downloads_action_type ON downloads_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_downloads_device_type ON downloads_tracking(device_type);
CREATE INDEX IF NOT EXISTS idx_downloads_session_id ON downloads_tracking(session_id);

-- Tabella per le statistiche aggregate (opzionale, per performance)
CREATE TABLE IF NOT EXISTS downloads_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_downloads INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  downloads_by_device JSONB, -- {'desktop': 10, 'mobile': 5, 'tablet': 2}
  shares_by_platform JSONB, -- {'whatsapp': 15, 'instagram': 8, 'facebook': 3}
  unique_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Trigger per aggiornare le statistiche (opzionale)
CREATE OR REPLACE FUNCTION update_downloads_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna le statistiche del giorno
  INSERT INTO downloads_stats (date, total_downloads, total_shares, unique_users)
  VALUES (
    DATE(NEW.download_timestamp),
    CASE WHEN NEW.action_type = 'download' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type LIKE 'share_%' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (date) DO UPDATE SET
    total_downloads = downloads_stats.total_downloads + CASE WHEN NEW.action_type = 'download' THEN 1 ELSE 0 END,
    total_shares = downloads_stats.total_shares + CASE WHEN NEW.action_type LIKE 'share_%' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger
DROP TRIGGER IF EXISTS trigger_update_downloads_stats ON downloads_tracking;
CREATE TRIGGER trigger_update_downloads_stats
  AFTER INSERT ON downloads_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_downloads_stats();

-- Politica RLS (Row Level Security) - solo inserimento pubblico, lettura solo per admin
ALTER TABLE downloads_tracking ENABLE ROW LEVEL SECURITY;

-- Permetti inserimento a tutti (per il tracking)
CREATE POLICY "Allow insert for all" ON downloads_tracking
  FOR INSERT WITH CHECK (true);

-- Permetti lettura solo agli admin (se necessario)
CREATE POLICY "Allow read for admin" ON downloads_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

-- Stessa cosa per la tabella stats
ALTER TABLE downloads_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read stats for admin" ON downloads_stats
  FOR SELECT USING (auth.role() = 'authenticated');
