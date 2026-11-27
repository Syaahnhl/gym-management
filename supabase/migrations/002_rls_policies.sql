-- ============================================================================
-- Row Level Security (RLS) Policies
-- Memastikan pembatasan akses diterapkan di level database (tidak hanya UI)
-- ============================================================================

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: ambil role staff aktif dari auth.uid()
CREATE OR REPLACE FUNCTION current_staff_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_staff_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM users
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

-- 1. gym_settings: semua staff aktif boleh baca; hanya owner boleh ubah
CREATE POLICY "Staff baca profil gym" ON gym_settings
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner kelola profil gym" ON gym_settings
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

-- 2. users: owner kelola semua; kasir hanya boleh baca profil sendiri
CREATE POLICY "Owner kelola semua staff" ON users
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Staff baca akun sendiri" ON users
  FOR SELECT USING (id = current_staff_id());

-- 3. packages: semua staff boleh baca paket; hanya owner boleh tambah/edit
CREATE POLICY "Staff baca paket" ON packages
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner kelola paket" ON packages
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

-- 4. members: owner penuh; kasir boleh baca, tambah, edit (tidak boleh hapus/nonaktifkan via delete)
CREATE POLICY "Staff baca member" ON members
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff tambah member" ON members
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff edit member" ON members
  FOR UPDATE USING (current_staff_role() IN ('owner', 'cashier'))
  WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

-- 5. memberships: staff boleh baca & insert; hanya owner boleh update (void)
CREATE POLICY "Staff baca memberships" ON memberships
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff buat memberships" ON memberships
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner void memberships" ON memberships
  FOR UPDATE USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

-- 6. transactions: owner baca semua & void; kasir baca transaksi shift sendiri & buat baru
CREATE POLICY "Owner kelola transaksi" ON transactions
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Kasir baca transaksi sendiri" ON transactions
  FOR SELECT USING (current_staff_role() = 'cashier' AND cashier_id = current_staff_id());

CREATE POLICY "Kasir buat transaksi" ON transactions
  FOR INSERT WITH CHECK (current_staff_role() = 'cashier' AND cashier_id = current_staff_id());

-- 7. checkins: semua staff aktif boleh baca & buat
CREATE POLICY "Staff baca checkins" ON checkins
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff buat checkins" ON checkins
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

-- 8. shifts: owner baca semua; kasir baca, buka, tutup shift sendiri
CREATE POLICY "Owner baca semua shift" ON shifts
  FOR SELECT USING (current_staff_role() = 'owner');

CREATE POLICY "Staff kelola shift sendiri" ON shifts
  FOR ALL USING (current_staff_role() IN ('owner', 'cashier') AND cashier_id = current_staff_id())
  WITH CHECK (current_staff_role() IN ('owner', 'cashier') AND cashier_id = current_staff_id());

-- 9. activity_logs: semua staff boleh insert log; hanya owner boleh membaca
CREATE POLICY "Staff catat log" ON activity_logs
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner baca log aktivitas" ON activity_logs
  FOR SELECT USING (current_staff_role() = 'owner');
