-- ============================================================================
-- Sistem Manajemen Gym (MVP) - Skema Database Awal
-- Zona waktu default: Asia/Jakarta (WIB)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Pengaturan Gym (single row untuk 1 lokasi)
CREATE TABLE IF NOT EXISTS gym_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'IronPeak Gym',
  address TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  whatsapp_number TEXT NOT NULL DEFAULT '',
  reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 1 AND reminder_days <= 60),
  reminder_template TEXT NOT NULL DEFAULT 'Halo {nama}, masa aktif membership Anda di {nama_gym} akan berakhir pada {tanggal_habis} ({sisa_hari} hari lagi). Yuk segera perpanjang agar latihan tetap lancar!',
  max_cashier_discount INTEGER NOT NULL DEFAULT 50000 CHECK (max_cashier_discount >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Staff (Owner & Kasir)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Paket Membership & Harian
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('membership', 'daily')),
  duration_days INTEGER NOT NULL CHECK (duration_days >= 1),
  price INTEGER NOT NULL CHECK (price >= 0),
  registration_fee INTEGER NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Member
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  gender TEXT CHECK (gender IN ('L', 'P')),
  birth_date DATE,
  address TEXT,
  id_number TEXT,
  photo_url TEXT,
  emergency_contact TEXT,
  notes TEXT,
  portal_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_reminded_at TIMESTAMPTZ,
  last_reminded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 5. Shift Kasir
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL REFERENCES users(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opening_cash INTEGER NOT NULL DEFAULT 0 CHECK (opening_cash >= 0),
  closed_at TIMESTAMPTZ,
  expected_cash INTEGER,
  actual_cash INTEGER,
  difference INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Pastikan satu kasir hanya memiliki maksimal satu shift terbuka
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_one_open_per_cashier
  ON shifts (cashier_id)
  WHERE status = 'open';

-- 6. Transaksi Pembayaran
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'renewal', 'daily')),
  member_id UUID REFERENCES members(id),
  guest_name TEXT,
  guest_phone TEXT,
  package_id UUID NOT NULL REFERENCES packages(id),
  package_price INTEGER NOT NULL CHECK (package_price >= 0),
  registration_fee INTEGER NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  discount_reason TEXT,
  total INTEGER NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'card')),
  cash_received INTEGER,
  change_amount INTEGER,
  cashier_id UUID NOT NULL REFERENCES users(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'void')),
  void_reason TEXT,
  voided_by UUID REFERENCES users(id),
  voided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Masa Aktif Membership (dihitung dari transaksi yang tidak void)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- 8. Check-in
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  transaction_id UUID REFERENCES transactions(id),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('qr', 'search', 'daily')),
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  cashier_id UUID NOT NULL REFERENCES users(id)
);

-- 9. Log Aktivitas
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indeks Wajib (Bagian 14 PRD) & Indeks Pendukung Performa
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_members_phone ON members (phone);
CREATE INDEX IF NOT EXISTS idx_members_member_code ON members (member_code);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members (full_name);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships (end_date);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships (member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_shift_id ON transactions (shift_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions (member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_at ON checkins (checked_in_at);
CREATE INDEX IF NOT EXISTS idx_checkins_member_id ON checkins (member_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
