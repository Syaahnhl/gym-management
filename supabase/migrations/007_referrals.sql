-- ============================================================================
-- Fase 2A - Fitur 5: Referral
-- ============================================================================

ALTER TABLE gym_settings
  ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS referral_discount_amount INTEGER NOT NULL DEFAULT 50000 CHECK (referral_discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS referral_reward_type TEXT NOT NULL DEFAULT 'days' CHECK (referral_reward_type IN ('days', 'discount_balance')),
  ADD COLUMN IF NOT EXISTS referral_reward_value INTEGER NOT NULL DEFAULT 7 CHECK (referral_reward_value >= 0);

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS discount_balance INTEGER NOT NULL DEFAULT 0 CHECK (discount_balance >= 0);

-- Isi referral_code untuk member lama yang belum punya
UPDATE members
SET referral_code = 'REF-' || REPLACE(member_code, 'GYM-', '')
WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_member_id UUID NOT NULL REFERENCES members(id),
  referred_member_id UUID NOT NULL UNIQUE REFERENCES members(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('days', 'discount_balance')),
  reward_value INTEGER NOT NULL CHECK (reward_value >= 0),
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_referral_code ON members (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_member_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff baca referrals" ON referrals
  FOR SELECT USING (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Staff catat referrals" ON referrals
  FOR INSERT WITH CHECK (current_staff_role() IN ('owner', 'cashier'));

CREATE POLICY "Owner update referrals" ON referrals
  FOR UPDATE USING (current_staff_role() = 'owner')
  WITH CHECK (current_staff_role() = 'owner');
