-- ============================================================================
-- Fase 2B - Fitur 3: Multi-Cabang & Integrasi Turnstile Pintu Otomatis
-- ============================================================================

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS turnstile_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS turnstile_webhook_url TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca branches" ON branches FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Owner kelola branches" ON branches FOR ALL USING (current_staff_role() = 'owner') WITH CHECK (current_staff_role() = 'owner');
