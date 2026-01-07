-- ==========================================
-- ADMIN PANEL V2 - GENİŞLETİLMİŞ ÖZELLİKLER
-- Supabase SQL Editor'de çalıştırın
-- ==========================================

-- ==========================================
-- 1. ANALİTİK TABLOLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prayer_id UUID,
  prayer_title TEXT,
  event_type TEXT NOT NULL, -- 'read', 'complete', 'share', 'add'
  count INT DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analitik için indeksler
CREATE INDEX IF NOT EXISTS idx_analytics_prayer_id ON analytics_events(prayer_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics events are insertable by authenticated" ON analytics_events;
CREATE POLICY "Analytics events are insertable by authenticated" ON analytics_events 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can view all analytics" ON analytics_events;
CREATE POLICY "Admins can view all analytics" ON analytics_events 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ==========================================
-- 2. DİNAMİK BANNER TABLOLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  image_url TEXT,
  link_url TEXT,
  bg_color TEXT DEFAULT '#10b981',
  text_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target TEXT DEFAULT 'all', -- 'all', 'premium', 'free'
  priority INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners are viewable by everyone" ON banners;
CREATE POLICY "Banners are viewable by everyone" ON banners 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
CREATE POLICY "Admins can manage banners" ON banners 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ==========================================
-- 3. GLOBAL HATİM KAMPANYALARI
-- ==========================================

CREATE TABLE IF NOT EXISTS global_hatim_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal INT DEFAULT 1000,
  current_count INT DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hatim_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES global_hatim_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  part_no INT NOT NULL CHECK (part_no >= 1 AND part_no <= 30),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id, part_no)
);

-- RLS
ALTER TABLE global_hatim_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE hatim_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON global_hatim_campaigns;
CREATE POLICY "Campaigns are viewable by everyone" ON global_hatim_campaigns 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage campaigns" ON global_hatim_campaigns;
CREATE POLICY "Admins can manage campaigns" ON global_hatim_campaigns 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view their participations" ON hatim_participations;
CREATE POLICY "Users can view their participations" ON hatim_participations 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Users can manage their participations" ON hatim_participations;
CREATE POLICY "Users can manage their participations" ON hatim_participations 
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. MODERASYON / ŞİKAYET TABLOLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_id UUID,
  content_type TEXT, -- 'message', 'group', 'prayer', 'user'
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  admin_note TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports" ON reports 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ==========================================
-- 5. CMS / MAKALE TABLOLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON article_categories;
CREATE POLICY "Categories are viewable by everyone" ON article_categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON article_categories;
CREATE POLICY "Admins can manage categories" ON article_categories 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON articles;
CREATE POLICY "Published articles are viewable by everyone" ON articles 
  FOR SELECT USING (is_published = true OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage articles" ON articles;
CREATE POLICY "Admins can manage articles" ON articles 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ==========================================
-- 6. FİNANSAL / KUPON TABLOLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percent', 'fixed', 'free_month', 'free_year'
  discount_value INT DEFAULT 0,
  max_uses INT DEFAULT 100,
  current_uses INT DEFAULT 0,
  min_purchase DECIMAL(10,2),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  type TEXT NOT NULL, -- 'subscription', 'renewal', 'refund', 'cancellation'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT,
  coupon_id UUID REFERENCES coupons(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Users can validate coupons" ON coupons;
CREATE POLICY "Users can validate coupons" ON coupons 
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 7. TEKNİK AYARLAR / REMOTE CONFIG
-- ==========================================

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan config değerleri
INSERT INTO app_config (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Uygulama bakımda, lütfen daha sonra tekrar deneyin.", "end_time": null}', 'Bakım modu ayarları'),
  ('feature_flags', '{"dream_interpreter": true, "global_hatim": true, "prayer_coach": true, "social_features": true}', 'Özellik açma/kapama'),
  ('min_app_version', '{"ios": "1.0.0", "android": "1.0.0"}', 'Minimum uygulama versiyonu'),
  ('announcement', '{"enabled": false, "title": "", "message": "", "type": "info"}', 'Genel duyuru'),
  ('rate_limits', '{"ai_requests_per_day": 10, "ai_requests_premium": 100}', 'API limitleri')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App config is readable by everyone" ON app_config;
CREATE POLICY "App config is readable by everyone" ON app_config 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage app config" ON app_config;
CREATE POLICY "Admins can manage app config" ON app_config 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ==========================================
-- YARDIMCI FONKSİYONLAR
-- ==========================================

-- Kampanya sayacını artır (trigger)
CREATE OR REPLACE FUNCTION update_campaign_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    UPDATE global_hatim_campaigns 
    SET current_count = current_count + 1 
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_hatim_completion ON hatim_participations;
CREATE TRIGGER on_hatim_completion
  AFTER INSERT OR UPDATE ON hatim_participations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_count();

-- Makale slug oluşturucu
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )) || '-' || substring(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. PAYLAŞIMLI SES CACHE
-- API maliyetinden tasarruf için
-- ==========================================

CREATE TABLE IF NOT EXISTS shared_audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dua metninin hash'i (aynı metin = aynı ses)
  text_hash TEXT UNIQUE NOT NULL,
  -- Kısa tanımlayıcı (debug için)
  text_preview TEXT,
  -- Base64 audio verisi
  audio_base64 TEXT NOT NULL,
  -- Audio boyutu (bytes)
  audio_size INT,
  -- Kaç kez kullanıldı
  usage_count INT DEFAULT 1,
  -- İlk oluşturan kullanıcı
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Son kullanım
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hızlı arama için indeks
CREATE INDEX IF NOT EXISTS idx_audio_cache_hash ON shared_audio_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_audio_cache_usage ON shared_audio_cache(usage_count DESC);

-- RLS
ALTER TABLE shared_audio_cache ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (cache'den ses alabilir)
DROP POLICY IF EXISTS "Audio cache is readable by authenticated" ON shared_audio_cache;
CREATE POLICY "Audio cache is readable by authenticated" ON shared_audio_cache 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated kullanıcılar yeni cache ekleyebilir
DROP POLICY IF EXISTS "Authenticated can insert audio cache" ON shared_audio_cache;
CREATE POLICY "Authenticated can insert audio cache" ON shared_audio_cache 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Kullanım sayısını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_audio_usage(hash TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shared_audio_cache 
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE text_hash = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
