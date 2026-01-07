-- ==========================================
-- user_prayers RLS FIX - Liderlik Tablosu İçin
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- ==========================================

-- user_prayers tablosunda mevcut RLS politikalarını kontrol et ve düzelt

-- Önce mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view own prayers" ON user_prayers;
DROP POLICY IF EXISTS "Users can manage own prayers" ON user_prayers;
DROP POLICY IF EXISTS "Authenticated users can view all prayer counts" ON user_prayers;
DROP POLICY IF EXISTS "Authenticated can view prayer counts for leaderboard" ON user_prayers; -- YENİ EKLENDİ

-- Yeni politikalar ekle:

-- 1. Kullanıcıların kendi kayıtlarını yönetmesi için
CREATE POLICY "Users can manage own prayers" ON user_prayers 
  FOR ALL 
  USING (auth.uid() = user_id);

-- 2. Liderlik tablosu için: Authenticated kullanıcılar current_count'u görebilir (sadece okuma)
CREATE POLICY "Authenticated can view prayer counts for leaderboard" ON user_prayers 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ==========================================
-- custom_prayers için aynı düzeltme
-- ==========================================

DROP POLICY IF EXISTS "Users can view own custom prayers" ON custom_prayers;
DROP POLICY IF EXISTS "Users can manage own custom prayers" ON custom_prayers;
DROP POLICY IF EXISTS "Authenticated users can view all custom prayer counts" ON custom_prayers;
DROP POLICY IF EXISTS "Authenticated can view custom prayer counts for leaderboard" ON custom_prayers; -- YENİ EKLENDİ

-- 1. Kullanıcıların kendi custom dualarını yönetmesi
CREATE POLICY "Users can manage own custom prayers" ON custom_prayers 
  FOR ALL 
  USING (auth.uid() = user_id);

-- 2. Liderlik tablosu için: Authenticated kullanıcılar custom_prayers current_count'u görebilir
CREATE POLICY "Authenticated can view custom prayer counts for leaderboard" ON custom_prayers 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ==========================================
-- PRAYERS (Katalog) RLS FIX - KRİTİK: Herkes okuyabilir
-- ==========================================

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public prayers are viewable by everyone" ON prayers;

CREATE POLICY "Public prayers are viewable by everyone" 
ON prayers FOR SELECT 
USING (true);

-- ==========================================
-- Sonucu doğrula
-- ==========================================

-- Bu sorgu çalışmalı ve tüm kullanıcıların prayer count'larını döndürmeli:
-- SELECT user_id, SUM(current_count) as total FROM user_prayers GROUP BY user_id;
