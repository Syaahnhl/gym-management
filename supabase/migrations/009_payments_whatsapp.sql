-- ============================================================================
-- Fase 2B - Fitur 2: Payment Gateway (Midtrans/Xendit) & WhatsApp Otomatis
-- ============================================================================

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS payment_gateway_provider TEXT NOT NULL DEFAULT 'none' CHECK (payment_gateway_provider IN ('none', 'midtrans', 'xendit')),
  ADD COLUMN IF NOT EXISTS payment_gateway_server_key TEXT,
  ADD COLUMN IF NOT EXISTS auto_wa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wa_api_provider TEXT NOT NULL DEFAULT 'none' CHECK (wa_api_provider IN ('none', 'fonnte', 'wablas', 'cloud_api')),
  ADD COLUMN IF NOT EXISTS wa_api_token TEXT;

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES members(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  provider TEXT NOT NULL DEFAULT 'midtrans',
  payment_url TEXT,
  qr_string TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
  paid_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'receipt', 'portal')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca payment_intents" ON payment_intents FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
CREATE POLICY "Staff baca whatsapp_logs" ON whatsapp_logs FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));
