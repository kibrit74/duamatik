-- =============================================
-- API Ayarları ve Kullanım İstatistikleri
-- =============================================

-- App Settings tablosu (API anahtarları vb. için)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Varsayılan Gemini API anahtarını ekle (mevcut .env'den alınmalı)
INSERT INTO app_settings (key, value) VALUES ('gemini_api_key', '')
ON CONFLICT (key) DO NOTHING;

-- Varsayılan reklam oranlarını ekle (API maliyetine göre ayarlandı)
INSERT INTO app_settings (key, value) VALUES 
  ('ad_rate_tts', '2'),      -- Ses oluşturma: 2 reklam (yüksek maliyet)
  ('ad_rate_ocr', '1'),      -- Resimden dua: 1 reklam (orta maliyet)
  ('ad_rate_dream', '1'),    -- Rüya tabiri: 1 reklam (tek API çağrısı)
  ('ad_rate_chat', '2')      -- Manevi koç: 2 reklam (oturum bazlı, çoklu mesaj)
ON CONFLICT (key) DO NOTHING;

-- Usage Stats tablosu
CREATE TABLE IF NOT EXISTS usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('tts', 'ocr', 'ad_watched', 'chat')),
    cost_estimate DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_usage_stats_type ON usage_stats(type);
CREATE INDEX IF NOT EXISTS idx_usage_stats_created_at ON usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);

-- RLS Politikaları
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri temizle (tekrar çalıştırılabilir olması için)
DROP POLICY IF EXISTS "Admins can read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can update app_settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can insert app_settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own usage_stats" ON usage_stats;
DROP POLICY IF EXISTS "Admins can read all usage_stats" ON usage_stats;

-- App Settings: Sadece adminler okuyabilir/yazabilir
CREATE POLICY "Admins can read app_settings" ON app_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update app_settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert app_settings" ON app_settings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Tüm authenticated kullanıcılar gemini_api_key ve ad_rate ayarlarını okuyabilir
DROP POLICY IF EXISTS "All users can read gemini_api_key" ON app_settings;
DROP POLICY IF EXISTS "All users can read public settings" ON app_settings;
CREATE POLICY "All users can read public settings" ON app_settings
    FOR SELECT USING (
        (key = 'gemini_api_key' OR key LIKE 'ad_rate_%') AND auth.uid() IS NOT NULL
    );

-- Usage Stats: Herkes kendi kaydını ekleyebilir, adminler hepsini görebilir
CREATE POLICY "Users can insert own usage_stats" ON usage_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all usage_stats" ON usage_stats
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Özet istatistikler için view
DROP VIEW IF EXISTS usage_summary;
CREATE OR REPLACE VIEW usage_summary AS
SELECT 
    type,
    COUNT(*) as total_count,
    SUM(cost_estimate) as total_cost,
    DATE(created_at) as date
FROM usage_stats
GROUP BY type, DATE(created_at)
ORDER BY date DESC;

-- Adminlere view erişimi
GRANT SELECT ON usage_summary TO authenticated;
