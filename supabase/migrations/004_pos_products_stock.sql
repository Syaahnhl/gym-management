-- ============================================================================
-- Fase 2A - Fitur 2: POS Produk & Stok
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('minuman', 'suplemen', 'merchandise', 'sewa')),
  sku TEXT UNIQUE,
  sell_price INTEGER NOT NULL CHECK (sell_price >= 0),
  cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'sale', 'void', 'adjustment')),
  qty INTEGER NOT NULL,
  reason TEXT,
  reference_id TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('package', 'product')),
  item_id UUID NOT NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

-- Izinkan transaksi POS tanpa package_id & tipe pos/mixed
ALTER TABLE transactions ALTER COLUMN package_id DROP NOT NULL;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('registration', 'renewal', 'daily', 'pos', 'mixed'));

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items (transaction_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca produk" ON products
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Owner kelola produk" ON products
  FOR ALL USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');

CREATE POLICY "Staff baca mutasi stok" ON stock_movements
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Staff catat mutasi stok" ON stock_movements
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff baca item transaksi" ON transaction_items
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Staff buat item transaksi" ON transaction_items
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));
