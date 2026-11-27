export type StaffRole = "owner" | "cashier";
export type PackageType = "membership" | "daily";
export type Gender = "L" | "P";
export type MembershipStatus = "active" | "void";
export type TransactionType = "registration" | "renewal" | "daily";
export type PaymentMethod = "cash" | "qris" | "transfer" | "card";
export type TransactionStatus = "paid" | "void";
export type CheckinMethod = "qr" | "search" | "daily";
export type ShiftStatus = "open" | "closed";

export type ComputedMemberStatus =
  | "active"
  | "expiring"
  | "expired"
  | "not_started"
  | "inactive";

export interface GymSettings {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
  whatsapp_number: string;
  reminder_days: number;
  reminder_template: string;
  max_cashier_discount: number;
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
  package_id: string;
  package_price: number;
  registration_fee: number;
  discount: number;
  discount_reason: string | null;
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
