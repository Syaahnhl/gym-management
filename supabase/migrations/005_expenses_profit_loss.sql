-- ============================================================================
-- Fase 2A - Fitur 3: Pengeluaran & Laba Rugi
-- ============================================================================

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS cashier_can_record_expense BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('gaji', 'listrik', 'air', 'sewa', 'perawatan', 'kebersihan', 'marketing', 'lainnya')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'card')),
  date DATE NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  shift_id UUID REFERENCES shifts(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_shift_id ON expenses (shift_id);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner kelola pengeluaran" ON expenses
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Kasir baca pengeluaran sendiri" ON expenses
  FOR SELECT USING (current_staff_role() = 'cashier' AND created_by = current_staff_id());

CREATE POLICY "Kasir catat pengeluaran" ON expenses
  FOR INSERT WITH CHECK (current_staff_role() = 'cashier' AND created_by = current_staff_id());
