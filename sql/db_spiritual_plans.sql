-- ==========================================
-- MANEVİ KOÇ PLANLARI (SPIRITUAL PLANS)
-- ==========================================

CREATE TABLE IF NOT EXISTS spiritual_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  description TEXT,
  mood TEXT,
  plan_data JSONB, -- SpiritualPlan tipindeki veriyi tutar (days array vb.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- RLS Politikaları
ALTER TABLE spiritual_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own plans" ON spiritual_plans;

CREATE POLICY "Users can manage own plans" ON spiritual_plans
  FOR ALL
  USING (auth.uid() = user_id);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_spiritual_plans_user_id ON spiritual_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_plans_created_at ON spiritual_plans(created_at DESC);
