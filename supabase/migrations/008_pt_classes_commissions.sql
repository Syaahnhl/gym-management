-- ============================================================================
-- Fase 2B - Fitur 1: Personal Trainer (PT), Jadwal Kelas & Komisi
-- ============================================================================

CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  commission_type TEXT NOT NULL DEFAULT 'percent' CHECK (commission_type IN ('percent', 'fixed')),
  commission_value INTEGER NOT NULL DEFAULT 30 CHECK (commission_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pt_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sessions_count INTEGER NOT NULL CHECK (sessions_count >= 1),
  price INTEGER NOT NULL CHECK (price >= 0),
  validity_days INTEGER NOT NULL DEFAULT 60 CHECK (validity_days >= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  trainer_id UUID NOT NULL REFERENCES trainers(id),
  pt_package_id UUID REFERENCES pt_packages(id),
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL DEFAULT '09:00',
  session_fee INTEGER NOT NULL DEFAULT 0 CHECK (session_fee >= 0),
  commission_amount INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  trainer_id UUID REFERENCES trainers(id),
  class_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 15 CHECK (max_capacity >= 1),
  fee_per_session INTEGER NOT NULL DEFAULT 0 CHECK (fee_per_session >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_schedule_id UUID NOT NULL REFERENCES class_schedules(id),
  member_id UUID NOT NULL REFERENCES members(id),
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_schedule_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_sessions_trainer ON pt_sessions (trainer_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_date ON class_schedules (class_date);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca trainers" ON trainers FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Owner kelola trainers" ON trainers FOR ALL USING (current_staff_role() = 'owner') WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Staff baca pt_packages" ON pt_packages FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Owner kelola pt_packages" ON pt_packages FOR ALL USING (current_staff_role() = 'owner') WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Staff kelola pt_sessions" ON pt_sessions FOR ALL USING (current_staff_role() IN ('owner', 'cashier')) WITH CHECK (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Staff baca class_schedules" ON class_schedules FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Owner kelola class_schedules" ON class_schedules FOR ALL USING (current_staff_role() = 'owner') WITH CHECK (current_staff_role() = 'owner');
CREATE POLICY "Staff kelola class_bookings" ON class_bookings FOR ALL USING (current_staff_role() IN ('owner', 'cashier')) WITH CHECK (current_staff_role() IN ('owner', 'cashier'));
