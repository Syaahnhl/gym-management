-- ============================================================================
-- Fase 2A - Fitur 4: Promo & Voucher
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'nominal')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'package', 'product')),
  target_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_quota INTEGER CHECK (max_quota IS NULL OR max_quota >= 1),
  max_per_member INTEGER CHECK (max_per_member IS NULL OR max_per_member >= 1),
  new_member_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions (code);
CREATE INDEX IF NOT EXISTS idx_transactions_promotion_id ON transactions (promotion_id);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca promo" ON promotions
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner kelola promo" ON promotions
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');
