-- ============================================================================
-- Fase 2A - Fitur 1: Freeze / Cuti Membership
-- ============================================================================

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS freeze_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS freeze_min_days INTEGER NOT NULL DEFAULT 3 CHECK (freeze_min_days >= 1),
  ADD COLUMN IF NOT EXISTS freeze_max_days INTEGER NOT NULL DEFAULT 30 CHECK (freeze_max_days >= 1),
  ADD COLUMN IF NOT EXISTS freeze_max_days_per_period INTEGER NOT NULL DEFAULT 30 CHECK (freeze_max_days_per_period >= 1),
  ADD COLUMN IF NOT EXISTS freeze_fee INTEGER NOT NULL DEFAULT 0 CHECK (freeze_fee >= 0);

CREATE TABLE IF NOT EXISTS freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  membership_id UUID NOT NULL REFERENCES memberships(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_end_date DATE,
  reason TEXT NOT NULL CHECK (reason IN ('sakit', 'dinas', 'lainnya')),
  reason_notes TEXT,
  attachment_url TEXT,
  fee INTEGER NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled')),
  cancel_reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_freezes_member_id ON freezes (member_id);
CREATE INDEX IF NOT EXISTS idx_freezes_status ON freezes (status);

ALTER TABLE freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca freezes" ON freezes
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff ajukan dan akhiri freeze" ON freezes
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff update freeze" ON freezes
  FOR UPDATE USING (current_staff_role() IN ('owner', 'cashier'))
  WITH CHECK (current_staff_role() IN ('owner', 'cashier'));
