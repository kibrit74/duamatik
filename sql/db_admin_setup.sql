-- ================================================
-- ADMIN KULLANICISI ATAMA REHBERİ
-- ================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın.

-- 1. Önce mevcut kullanıcıları listeleyin:
SELECT id, email, name, role FROM profiles ORDER BY created_at DESC;

-- 2. Admin yapmak istediğiniz kullanıcının e-posta adresini bulun.
--    Sonra aşağıdaki komutu kullanıcının e-postası ile güncelleyin:

-- ÖRNEK: 'admin@example.com' yerine kendi e-postanızı yazın
UPDATE profiles
SET role = 'admin'
WHERE email = 'yavuzob@gmail.com';

-- 3. Değişikliği doğrulayın:
SELECT id, email, name, role FROM profiles WHERE role = 'admin';

-- ================================================
-- GÜVENLİK NOTLARI:
-- ================================================
-- 1. Bu işlem sadece veritabanına doğrudan erişimi olan kişiler tarafından yapılabilir.
-- 2. Uygulama içinde admin kaydı yoktur - bu tasarım gereğidir.
-- 3. Admin yetkisini kaldırmak için: role = 'user' yapın.
-- 4. Birden fazla admin olabilir.

-- EK: Rol sütunu yoksa oluşturun (genellikle mevcuttur)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
