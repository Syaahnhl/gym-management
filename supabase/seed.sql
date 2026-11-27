-- ============================================================================
-- Seed Data Contoh (Bagian 14 PRD):
-- 1 Owner, 2 Kasir, 5 Paket, dan 50 Member dengan status beragam
-- Password default untuk semua akun contoh: gym123456
-- ============================================================================

INSERT INTO gym_settings (name, address, whatsapp_number, reminder_days, max_cashier_discount)
VALUES (
  'IronPeak Gym Jakarta',
  'Jl. Jend. Sudirman Kav. 45, Jakarta Selatan',
  '081299998888',
  7,
  50000
);

-- Staff: 1 Owner, 2 Kasir (password_hash menggunakan SHA-256 demo atau disesuaikan saat migrasi Auth)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Hendra Wijaya (Owner)', 'owner@ironpeak.id', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'owner', true),
  ('11111111-1111-1111-1111-111111111102', 'Siti Rahma (Kasir 1)', 'kasir1@ironpeak.id', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'cashier', true),
  ('11111111-1111-1111-1111-111111111103', 'Rizky Pratama (Kasir 2)', 'kasir2@ironpeak.id', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'cashier', true)
ON CONFLICT (email) DO NOTHING;

-- 5 Paket (Bulanan, 3 Bulan, 6 Bulan, 12 Bulan, Harian)
INSERT INTO packages (id, name, type, duration_days, price, registration_fee, description, is_active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Paket Harian (Walk-in)', 'daily', 1, 50000, 0, 'Akses gym 1 hari penuh tanpa registrasi member', true),
  ('22222222-2222-2222-2222-222222222202', 'Membership 1 Bulan', 'membership', 30, 350000, 100000, 'Akses seluruh alat gym selama 30 hari', true),
  ('22222222-2222-2222-2222-222222222203', 'Membership 3 Bulan', 'membership', 90, 950000, 100000, 'Hemat Rp 100.000 untuk paket 3 bulan', true),
  ('22222222-2222-2222-2222-222222222204', 'Membership 6 Bulan', 'membership', 180, 1800000, 50000, 'Gratis konsultasi awal & akses 6 bulan', true),
  ('22222222-2222-2222-2222-222222222205', 'Membership 12 Bulan', 'membership', 365, 3200000, 0, 'Paket tahunan bebas biaya pendaftaran', true)
ON CONFLICT DO NOTHING;

-- Generate 50 Member dengan status beragam (Aktif, Akan Habis, Habis, Belum Mulai, Nonaktif)
DO $$
DECLARE
  i INT;
  v_member_id UUID;
  v_shift_id UUID := '33333333-3333-3333-3333-333333333301';
  v_tx_id UUID;
  v_start DATE;
  v_end DATE;
  v_active BOOLEAN;
  v_pkg_id UUID;
  v_price INT;
BEGIN
  INSERT INTO shifts (id, cashier_id, opened_at, opening_cash, closed_at, expected_cash, actual_cash, difference, status)
  VALUES (v_shift_id, '11111111-1111-1111-1111-111111111102', NOW() - INTERVAL '30 days', 500000, NOW() - INTERVAL '29 days', 500000, 500000, 0, 'closed')
  ON CONFLICT DO NOTHING;

  FOR i IN 1..50 LOOP
    v_member_id := gen_random_uuid();
    v_tx_id := gen_random_uuid();
    v_active := CASE WHEN i > 47 THEN false ELSE true END;

    IF i <= 25 THEN
      -- Aktif
      v_start := CURRENT_DATE - ((i % 15) + 1);
      v_end := v_start + 29;
      v_pkg_id := '22222222-2222-2222-2222-222222222202';
      v_price := 350000;
    ELSIF i <= 35 THEN
      -- Akan habis (0..7 hari ke depan)
      v_end := CURRENT_DATE + (i - 25) % 7;
      v_start := v_end - 29;
      v_pkg_id := '22222222-2222-2222-2222-222222222202';
      v_price := 350000;
    ELSIF i <= 45 THEN
      -- Habis (1..25 hari lalu)
      v_end := CURRENT_DATE - (i - 35) * 2;
      v_start := v_end - 29;
      v_pkg_id := '22222222-2222-2222-2222-222222222202';
      v_price := 350000;
    ELSIF i <= 47 THEN
      -- Belum mulai
      v_start := CURRENT_DATE + 3;
      v_end := v_start + 29;
      v_pkg_id := '22222222-2222-2222-2222-222222222202';
      v_price := 350000;
    ELSE
      -- Nonaktif
      v_start := CURRENT_DATE - 10;
      v_end := CURRENT_DATE + 20;
      v_pkg_id := '22222222-2222-2222-2222-222222222202';
      v_price := 350000;
    END IF;

    INSERT INTO members (id, member_code, full_name, phone, gender, portal_token, is_active, created_by)
    VALUES (
      v_member_id,
      'GYM-' || LPAD(i::TEXT, 5, '0'),
      'Member Contoh ' || i,
      '08123456' || LPAD(i::TEXT, 4, '0'),
      CASE WHEN i % 2 = 0 THEN 'L' ELSE 'P' END,
      encode(gen_random_bytes(16), 'hex'),
      v_active,
      '11111111-1111-1111-1111-111111111102'
    )
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO transactions (id, invoice_number, type, member_id, package_id, package_price, registration_fee, discount, total, payment_method, cashier_id, shift_id, status)
    VALUES (
      v_tx_id,
      'INV-20261101-' || LPAD(i::TEXT, 4, '0'),
      'registration',
      v_member_id,
      v_pkg_id,
      v_price,
      100000,
      0,
      v_price + 100000,
      CASE WHEN i % 3 = 0 THEN 'qris' WHEN i % 3 = 1 THEN 'cash' ELSE 'transfer' END,
      '11111111-1111-1111-1111-111111111102',
      v_shift_id,
      'paid'
    )
    ON CONFLICT (invoice_number) DO NOTHING;

    INSERT INTO memberships (member_id, package_id, transaction_id, start_date, end_date, status)
    VALUES (v_member_id, v_pkg_id, v_tx_id, v_start, v_end, 'active');
  END LOOP;
END $$;
