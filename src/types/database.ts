export type StaffRole = "owner" | "cashier";
export type PackageType = "membership" | "daily";
export type Gender = "L" | "P";
export type MembershipStatus = "active" | "void";
export type TransactionType =
  | "registration"
  | "renewal"
  | "daily"
  | "pos"
  | "mixed";
export type ProductCategory = "minuman" | "suplemen" | "merchandise" | "sewa";
export type StockMovementType = "in" | "sale" | "void" | "adjustment";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string | null;
  sell_price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  qty: number;
  reason: string | null;
  reference_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_type: "package" | "product";
  item_id: string;
  name: string;
  qty: number;
  unit_price: number;
  cost_price: number;
  discount: number;
  subtotal: number;
}
export type PaymentMethod = "cash" | "qris" | "transfer" | "card";
export type TransactionStatus = "paid" | "void";
export type CheckinMethod = "qr" | "search" | "daily";
export type ShiftStatus = "open" | "closed";

export type ComputedMemberStatus =
  | "active"
  | "expiring"
  | "expired"
  | "not_started"
  | "frozen"
  | "inactive";

export type FreezeReason = "sakit" | "dinas" | "lainnya";
export type FreezeStatus = "active" | "finished" | "cancelled";

export interface Freeze {
  id: string;
  member_id: string;
  membership_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  actual_end_date: string | null;
  reason: FreezeReason;
  reason_notes?: string | null;
  attachment_url: string | null;
  fee: number;
  status: FreezeStatus;
  cancel_reason?: string | null;
  created_by: string | null;
  created_at: string;
}

export type ExpenseCategory =
  | "gaji"
  | "listrik"
  | "air"
  | "sewa"
  | "perawatan"
  | "kebersihan"
  | "marketing"
  | "lainnya";

export type DiscountType = "percent" | "nominal";

export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: "all" | "package" | "product";
  target_ids: string[];
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  max_quota: number | null;
  max_per_member: number | null;
  new_member_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  notes: string | null;
  receipt_url: string | null;
  shift_id: string | null;
  status: "active" | "void";
  created_by: string | null;
  created_at: string;
}

export type ReferralRewardType = "days" | "discount_balance";

export interface Referral {
  id: string;
  referrer_member_id: string;
  referred_member_id: string;
  transaction_id: string;
  reward_type: ReferralRewardType;
  reward_value: number;
  status: "granted" | "cancelled";
  created_at: string;
}

export interface GymSettings {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
  whatsapp_number: string;
  reminder_days: number;
  reminder_template: string;
  max_cashier_discount: number;
  freeze_allowed: boolean;
  freeze_min_days: number;
  freeze_max_days: number;
  freeze_max_days_per_period: number;
  freeze_fee: number;
  cashier_can_record_expense: boolean;
  referral_enabled: boolean;
  referral_discount_amount: number;
  referral_reward_type: ReferralRewardType;
  referral_reward_value: number;
  updated_at: string;
}

export interface StaffUser {
  id: string;
  auth_user_id?: string | null;
  name: string;
  email: string;
  password_hash: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}

export interface SafeStaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  type: PackageType;
  duration_days: number;
  price: number;
  registration_fee: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: Gender | null;
  birth_date: string | null;
  address: string | null;
  id_number: string | null;
  photo_url: string | null;
  emergency_contact: string | null;
  notes: string | null;
  portal_token: string;
  referral_code?: string;
  discount_balance?: number;
  is_active: boolean;
  last_reminded_at: string | null;
  last_reminded_by: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Membership {
  id: string;
  member_id: string;
  package_id: string;
  transaction_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: MembershipStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  type: TransactionType;
  member_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  package_id: string | null;
  package_price: number;
  registration_fee: number;
  discount: number;
  discount_reason: string | null;
  promotion_id?: string | null;
  total: number;
  payment_method: PaymentMethod;
  cash_received: number | null;
  change_amount: number | null;
  cashier_id: string;
  shift_id: string;
  status: TransactionStatus;
  void_reason: string | null;
  voided_by: string | null;
  voided_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Checkin {
  id: string;
  member_id: string | null;
  transaction_id: string | null;
  checked_in_at: string;
  method: CheckinMethod;
  is_duplicate: boolean;
  cashier_id: string;
}

export interface Shift {
  id: string;
  cashier_id: string;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  expected_cash: number | null;
  actual_cash: number | null;
  difference: number | null;
  notes: string | null;
  status: ShiftStatus;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MemberStatusInfo {
  status: ComputedMemberStatus;
  label: string;
  start_date: string | null;
  end_date: string | null;
  remaining_days: number | null;
  can_checkin: boolean;
}
