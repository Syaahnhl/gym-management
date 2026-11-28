import crypto from "crypto";
import {
  calculateFreezeDays,
  calculateRegistrationDates,
  calculateRenewalDates,
  computeEffectiveFreezeDays,
  computeMemberStatus,
  getJakartaTodayStr,
} from "@/lib/domain/membership";
import { formatInvoiceNumber, formatMemberCode } from "@/lib/domain/format";
import { readLocalDb, writeLocalDb } from "./local-store";
import { hashPassword } from "./seed-data";
import type {
  ActivityLog,
  Checkin,
  CheckinMethod,
  Expense,
  ExpenseCategory,
  Freeze,
  FreezeReason,
  GymSettings,
  Member,
  MemberStatusInfo,
  Membership,
  Package,
  PaymentMethod,
  Product,
  ProductCategory,
  Promotion,
  Referral,
  SafeStaffUser,
  Shift,
  StaffRole,
  StockMovement,
  Transaction,
  TransactionItem,
} from "@/types/database";
import { toSafeStaff } from "@/lib/auth/session";

export interface MemberWithStatus extends Member {
  status_info: MemberStatusInfo;
}

export function addActivityLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
): void {
  const db = readLocalDb();
  const entry: ActivityLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    created_at: new Date().toISOString(),
  };
  db.activity_logs.unshift(entry);
  writeLocalDb(db);
}

// ============================================================================
// Settings
// ============================================================================
export function getGymSettings(): GymSettings {
  return readLocalDb().gym_settings;
}

export function updateGymSettings(
  actorId: string,
  patch: Partial<Omit<GymSettings, "id" | "updated_at">>
): GymSettings {
  const db = readLocalDb();
  db.gym_settings = {
    ...db.gym_settings,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeLocalDb(db);
  addActivityLog(actorId, "update_settings", "gym_settings", db.gym_settings.id, patch);
  return db.gym_settings;
}

// ============================================================================
// Staff & Auth
// ============================================================================
export function authenticateStaff(email: string, password: string): SafeStaffUser | null {
  const db = readLocalDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!user || !user.is_active) return null;
  if (user.password_hash !== hashPassword(password)) return null;
  addActivityLog(user.id, "login", "user", user.id, { email: user.email });
  return toSafeStaff(user);
}

export function listStaff(): SafeStaffUser[] {
  return readLocalDb().users.map(toSafeStaff);
}

export function createStaff(
  actorId: string,
  input: { name: string; email: string; password: string; role: StaffRole }
): SafeStaffUser {
  const db = readLocalDb();
  const exists = db.users.some(
    (u) => u.email.toLowerCase() === input.email.trim().toLowerCase()
  );
  if (exists) {
    throw new Error("Email staff sudah terdaftar.");
  }
  const newUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password_hash: hashPassword(input.password),
    role: input.role,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeLocalDb(db);
  addActivityLog(actorId, "create_staff", "user", newUser.id, {
    name: newUser.name,
    role: newUser.role,
  });
  return toSafeStaff(newUser);
}

export function updateStaff(
  actorId: string,
  staffId: string,
  patch: { name?: string; role?: StaffRole; is_active?: boolean; password?: string }
): SafeStaffUser {
  const db = readLocalDb();
  const idx = db.users.findIndex((u) => u.id === staffId);
  if (idx === -1) throw new Error("Akun staff tidak ditemukan.");

  const current = db.users[idx];
  const updated = {
    ...current,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    role: patch.role ?? current.role,
    is_active: patch.is_active ?? current.is_active,
    password_hash: patch.password ? hashPassword(patch.password) : current.password_hash,
  };
  db.users[idx] = updated;
  writeLocalDb(db);
  addActivityLog(actorId, "update_staff", "user", staffId, {
    name: updated.name,
    role: updated.role,
    is_active: updated.is_active,
  });
  return toSafeStaff(updated);
}

export function changeOwnPassword(
  staffId: string,
  oldPassword: string,
  newPassword: string
): void {
  const db = readLocalDb();
  const idx = db.users.findIndex((u) => u.id === staffId);
  if (idx === -1) throw new Error("Akun tidak ditemukan.");
  if (db.users[idx].password_hash !== hashPassword(oldPassword)) {
    throw new Error("Password lama tidak sesuai.");
  }
  db.users[idx].password_hash = hashPassword(newPassword);
  writeLocalDb(db);
  addActivityLog(staffId, "change_password", "user", staffId, {});
}

// ============================================================================
// Packages
// ============================================================================
export function listPackages(activeOnly = false): Package[] {
  const pkgs = readLocalDb().packages;
  return activeOnly ? pkgs.filter((p) => p.is_active) : pkgs;
}

export function createPackage(
  actorId: string,
  input: Omit<Package, "id" | "created_at">
): Package {
  const db = readLocalDb();
  const pkg: Package = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.packages.push(pkg);
  writeLocalDb(db);
  addActivityLog(actorId, "create_package", "package", pkg.id, {
    name: pkg.name,
    price: pkg.price,
  });
  return pkg;
}

export function updatePackage(
  actorId: string,
  packageId: string,
  patch: Partial<Omit<Package, "id" | "created_at">>
): Package {
  const db = readLocalDb();
  const idx = db.packages.findIndex((p) => p.id === packageId);
  if (idx === -1) throw new Error("Paket tidak ditemukan.");
  db.packages[idx] = { ...db.packages[idx], ...patch };
  writeLocalDb(db);
  addActivityLog(actorId, "update_package", "package", packageId, patch);
  return db.packages[idx];
}

// ============================================================================
// Members
// ============================================================================
export function enrichMemberWithStatus(member: Member): MemberWithStatus {
  const db = readLocalDb();
  const memberShips = db.memberships.filter((m) => m.member_id === member.id);
  const memberFreezes = (db.freezes || []).filter(
    (f) => f.member_id === member.id
  );
  const status_info = computeMemberStatus(
    member,
    memberShips,
    db.gym_settings.reminder_days,
    getJakartaTodayStr(),
    memberFreezes
  );
  return { ...member, status_info };
}

export function listMembersWithStatus(): MemberWithStatus[] {
  const db = readLocalDb();
  const byMember = new Map<string, Membership[]>();
  for (const ms of db.memberships) {
    const arr = byMember.get(ms.member_id) ?? [];
    arr.push(ms);
    byMember.set(ms.member_id, arr);
  }
  const freezesByMember = new Map<string, Freeze[]>();
  for (const f of db.freezes || []) {
    const arr = freezesByMember.get(f.member_id) ?? [];
    arr.push(f);
    freezesByMember.set(f.member_id, arr);
  }
  const reminderDays = db.gym_settings.reminder_days;
  const todayStr = getJakartaTodayStr();
  return db.members.map((m) => ({
    ...m,
    status_info: computeMemberStatus(
      m,
      byMember.get(m.id) ?? [],
      reminderDays,
      todayStr,
      freezesByMember.get(m.id) ?? []
    ),
  }));
}

export function getMemberById(id: string): MemberWithStatus | null {
  const member = readLocalDb().members.find((m) => m.id === id);
  return member ? enrichMemberWithStatus(member) : null;
}

export function getMemberByCodeOrPhone(query: string): MemberWithStatus | null {
  const raw = query.trim();
  if (!raw) return null;
  const q = raw.toLowerCase();
  const portalMatch = raw.match(/\/m\/([^/?#]+)/i);
  const tokenFromUrl = portalMatch ? portalMatch[1].toLowerCase() : null;
  const shorthandCode = /^\d{1,5}$/.test(q)
    ? `gym-${q.padStart(5, "0")}`
    : null;
  const member = readLocalDb().members.find(
    (m) =>
      m.member_code.toLowerCase() === q ||
      (shorthandCode !== null && m.member_code.toLowerCase() === shorthandCode) ||
      m.phone.toLowerCase() === q ||
      m.portal_token.toLowerCase() === q ||
      (tokenFromUrl !== null && m.portal_token.toLowerCase() === tokenFromUrl)
  );
  return member ? enrichMemberWithStatus(member) : null;
}

export function getMemberByPortalToken(token: string): MemberWithStatus | null {
  const member = readLocalDb().members.find((m) => m.portal_token === token);
  return member ? enrichMemberWithStatus(member) : null;
}

export function createMemberRecord(
  actorId: string,
  input: {
    full_name: string;
    phone: string;
    email?: string | null;
    gender?: "L" | "P" | null;
    birth_date?: string | null;
    address?: string | null;
    id_number?: string | null;
    photo_url?: string | null;
    emergency_contact?: string | null;
    notes?: string | null;
  }
): Member {
  const db = readLocalDb();
  const cleanPhone = input.phone.trim();
  const duplicate = db.members.find((m) => m.phone === cleanPhone);
  if (duplicate) {
    const err = new Error(
      `Nomor HP ${cleanPhone} sudah terdaftar atas nama ${duplicate.full_name} (${duplicate.member_code}).`
    ) as Error & { existingMember?: Member };
    err.existingMember = duplicate;
    throw err;
  }

  const nextSeq = db.members.length + 1;
  const member: Member = {
    id: crypto.randomUUID(),
    member_code: formatMemberCode(nextSeq),
    full_name: input.full_name.trim(),
    phone: cleanPhone,
    email: input.email?.trim() || null,
    gender: input.gender ?? null,
    birth_date: input.birth_date || null,
    address: input.address?.trim() || null,
    id_number: input.id_number?.trim() || null,
    photo_url: input.photo_url || null,
    emergency_contact: input.emergency_contact?.trim() || null,
    notes: input.notes?.trim() || null,
    portal_token: crypto.randomBytes(20).toString("hex"),
    referral_code: `REF-${String(nextSeq).padStart(5, "0")}`,
    discount_balance: 0,
    is_active: true,
    last_reminded_at: null,
    last_reminded_by: null,
    created_at: new Date().toISOString(),
    created_by: actorId,
  };
  db.members.push(member);
  writeLocalDb(db);
  addActivityLog(actorId, "create_member", "member", member.id, {
    member_code: member.member_code,
    full_name: member.full_name,
  });
  return member;
}

export function updateMemberRecord(
  actorId: string,
  memberId: string,
  patch: Partial<
    Pick<
      Member,
      | "full_name"
      | "phone"
      | "email"
      | "gender"
      | "birth_date"
      | "address"
      | "id_number"
      | "photo_url"
      | "emergency_contact"
      | "notes"
      | "is_active"
    >
  >
): Member {
  const db = readLocalDb();
  const idx = db.members.findIndex((m) => m.id === memberId);
  if (idx === -1) throw new Error("Member tidak ditemukan.");

  if (patch.phone) {
    const dup = db.members.find(
      (m) => m.id !== memberId && m.phone === patch.phone?.trim()
    );
    if (dup) {
      throw new Error(`Nomor HP sudah dipakai oleh ${dup.full_name} (${dup.member_code}).`);
    }
  }

  db.members[idx] = { ...db.members[idx], ...patch };
  writeLocalDb(db);
  addActivityLog(actorId, "update_member", "member", memberId, patch);
  return db.members[idx];
}

export function markMemberReminded(actorId: string, memberId: string): Member {
  const db = readLocalDb();
  const idx = db.members.findIndex((m) => m.id === memberId);
  if (idx === -1) throw new Error("Member tidak ditemukan.");
  db.members[idx].last_reminded_at = new Date().toISOString();
  db.members[idx].last_reminded_by = actorId;
  writeLocalDb(db);
  addActivityLog(actorId, "send_reminder", "member", memberId, {});
  return db.members[idx];
}

// ============================================================================
// Shifts
// ============================================================================
export function getOpenShiftForCashier(cashierId: string): Shift | null {
  return (
    readLocalDb().shifts.find(
      (s) => s.cashier_id === cashierId && s.status === "open"
    ) ?? null
  );
}

export function listShifts(cashierId?: string): Shift[] {
  const shifts = readLocalDb().shifts;
  const filtered = cashierId ? shifts.filter((s) => s.cashier_id === cashierId) : shifts;
  return [...filtered].sort((a, b) => b.opened_at.localeCompare(a.opened_at));
}

export function openShift(actorId: string, openingCash: number): Shift {
  if (openingCash < 0) throw new Error("Saldo awal kas tidak boleh negatif.");
  const db = readLocalDb();
  const existing = db.shifts.find(
    (s) => s.cashier_id === actorId && s.status === "open"
  );
  if (existing) {
    throw new Error("Anda masih memiliki shift yang terbuka.");
  }

  const shift: Shift = {
    id: crypto.randomUUID(),
    cashier_id: actorId,
    opened_at: new Date().toISOString(),
    opening_cash: Math.round(openingCash),
    closed_at: null,
    expected_cash: null,
    actual_cash: null,
    difference: null,
    notes: null,
    status: "open",
  };
  db.shifts.push(shift);
  writeLocalDb(db);
  addActivityLog(actorId, "open_shift", "shift", shift.id, {
    opening_cash: shift.opening_cash,
  });
  return shift;
}

export function getShiftSummary(shiftId: string) {
  const db = readLocalDb();
  const shift = db.shifts.find((s) => s.id === shiftId);
  if (!shift) throw new Error("Shift tidak ditemukan.");

  const txs = db.transactions.filter(
    (t) => t.shift_id === shiftId && t.status === "paid"
  );
  const byMethod: Record<PaymentMethod, { count: number; total: number }> = {
    cash: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    card: { count: 0, total: 0 },
  };

  for (const tx of txs) {
    byMethod[tx.payment_method].count += 1;
    byMethod[tx.payment_method].total += tx.total;
  }

  const cashExpensesTotal = (db.expenses || [])
    .filter(
      (e) =>
        e.shift_id === shiftId &&
        e.payment_method === "cash" &&
        e.status === "active"
    )
    .reduce((acc, e) => acc + e.amount, 0);

  const expectedCash = shift.opening_cash + byMethod.cash.total - cashExpensesTotal;
  const totalRevenue = txs.reduce((acc, t) => acc + t.total, 0);

  return {
    shift,
    transaction_count: txs.length,
    total_revenue: totalRevenue,
    by_method: byMethod,
    cash_expenses_total: cashExpensesTotal,
    expected_cash: expectedCash,
  };
}

export function closeShift(
  actorId: string,
  shiftId: string,
  actualCash: number,
  notes?: string
): Shift {
  const db = readLocalDb();
  const idx = db.shifts.findIndex((s) => s.id === shiftId);
  if (idx === -1) throw new Error("Shift tidak ditemukan.");
  const shift = db.shifts[idx];

  if (shift.cashier_id !== actorId) {
    throw new Error("Anda hanya dapat menutup shift milik sendiri.");
  }
  if (shift.status === "closed") {
    throw new Error("Shift sudah ditutup dan tidak dapat diubah.");
  }

  const summary = getShiftSummary(shiftId);
  const difference = Math.round(actualCash) - summary.expected_cash;

  if (difference !== 0 && (!notes || !notes.trim())) {
    throw new Error("Catatan wajib diisi jika terdapat selisih kas.");
  }

  const closed: Shift = {
    ...shift,
    closed_at: new Date().toISOString(),
    expected_cash: summary.expected_cash,
    actual_cash: Math.round(actualCash),
    difference,
    notes: notes?.trim() || null,
    status: "closed",
  };
  db.shifts[idx] = closed;
  writeLocalDb(db);
  addActivityLog(actorId, "close_shift", "shift", shiftId, {
    expected_cash: closed.expected_cash,
    actual_cash: closed.actual_cash,
    difference: closed.difference,
  });
  return closed;
}

// ============================================================================
// Transactions (Registration, Renewal, Daily Walk-in, Void)
// ============================================================================
function nextInvoiceNumber(): string {
  const db = readLocalDb();
  const todayCompact = getJakartaTodayStr().replaceAll("-", "");
  const prefix = `INV-${todayCompact}-`;
  const todayCount = db.transactions.filter((t) =>
    t.invoice_number.startsWith(prefix)
  ).length;
  return formatInvoiceNumber(getJakartaTodayStr(), todayCount + 1);
}

function validateDiscountAndCash(
  actorRole: StaffRole,
  discount: number,
  discountReason: string | undefined,
  totalBeforeDiscount: number,
  paymentMethod: PaymentMethod,
  cashReceived?: number,
  isPromoDiscount = false
): { total: number; cashReceivedVal: number | null; changeAmount: number | null } {
  const settings = getGymSettings();
  if (discount < 0) throw new Error("Diskon tidak boleh negatif.");
  if (!isPromoDiscount && discount > 0 && (!discountReason || !discountReason.trim())) {
    throw new Error("Alasan diskon wajib diisi jika memberikan diskon.");
  }
  if (!isPromoDiscount && actorRole === "cashier" && discount > settings.max_cashier_discount) {
    throw new Error(
      `Diskon kasir melebihi batas maksimal (${settings.max_cashier_discount}).`
    );
  }
  const total = Math.max(0, totalBeforeDiscount - discount);

  if (paymentMethod === "cash") {
    if (cashReceived === undefined || cashReceived < total) {
      throw new Error("Uang tunai yang diterima kurang dari total pembayaran.");
    }
    return {
      total,
      cashReceivedVal: Math.round(cashReceived),
      changeAmount: Math.round(cashReceived) - total,
    };
  }

  return { total, cashReceivedVal: null, changeAmount: null };
}

export function processRegistrationTransaction(
  actor: SafeStaffUser,
  input: {
    memberData: Parameters<typeof createMemberRecord>[1];
    packageId: string;
    startDate?: string;
    discount?: number;
    discountReason?: string;
    promotionId?: string | null;
    promoCode?: string | null;
    referralCode?: string | null;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }
): { member: Member; transaction: Transaction; membership: Membership } {
  const shift = getOpenShiftForCashier(actor.id);
  if (!shift) {
    throw new Error("Buka shift terlebih dahulu sebelum membuat transaksi.");
  }

  const db = readLocalDb();
  const pkg = db.packages.find((p) => p.id === input.packageId && p.is_active);
  if (!pkg || pkg.type !== "membership") {
    throw new Error("Paket membership tidak valid atau tidak aktif.");
  }

  const subtotal = pkg.price + pkg.registration_fee;
  let discount = Math.round(input.discount ?? 0);
  let discountReason = input.discountReason;
  let appliedPromoId: string | null = null;
  let referrerMember: Member | null = null;

  if (input.referralCode && input.referralCode.trim()) {
    if (!db.gym_settings.referral_enabled) {
      throw new Error("Program referral sedang dinonaktifkan.");
    }
    const refCode = input.referralCode.trim().toUpperCase();
    referrerMember =
      db.members.find(
        (m) => m.is_active && m.referral_code?.toUpperCase() === refCode
      ) ?? null;
    if (!referrerMember) {
      throw new Error("Kode referral tidak ditemukan atau member pengajak tidak aktif.");
    }
    if (!input.promotionId && !input.promoCode && discount === 0) {
      discount = db.gym_settings.referral_discount_amount;
      discountReason = `Referral: ${referrerMember.referral_code}`;
    }
  }

  if (input.promotionId || input.promoCode) {
    const res = validatePromotion({
      promotionId: input.promotionId,
      promoCode: input.promoCode,
      isNewMember: true,
      packageId: pkg.id,
      subtotal,
    });
    appliedPromoId = res.promotion.id;
    discount = res.discountAmount;
    discountReason = `Promo: ${res.promotion.name}`;
  }

  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    discountReason,
    subtotal,
    input.paymentMethod,
    input.cashReceived,
    Boolean(appliedPromoId) || Boolean(referrerMember)
  );

  const { startDate, endDate } = calculateRegistrationDates(
    pkg.duration_days,
    input.startDate
  );

  // Create member first (validates unique phone)
  const member = createMemberRecord(actor.id, input.memberData);

  const freshDb = readLocalDb();
  const tx: Transaction = {
    id: crypto.randomUUID(),
    invoice_number: nextInvoiceNumber(),
    type: "registration",
    member_id: member.id,
    guest_name: null,
    guest_phone: null,
    package_id: pkg.id,
    package_price: pkg.price,
    registration_fee: pkg.registration_fee,
    discount,
    discount_reason: discount > 0 ? discountReason?.trim() || null : null,
    promotion_id: appliedPromoId,
    total,
    payment_method: input.paymentMethod,
    cash_received: cashReceivedVal,
    change_amount: changeAmount,
    cashier_id: actor.id,
    shift_id: shift.id,
    status: "paid",
    void_reason: null,
    voided_by: null,
    voided_at: null,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  const membership: Membership = {
    id: crypto.randomUUID(),
    member_id: member.id,
    package_id: pkg.id,
    transaction_id: tx.id,
    start_date: startDate,
    end_date: endDate,
    status: "active",
    created_at: new Date().toISOString(),
  };

  freshDb.transactions.push(tx);
  freshDb.memberships.push(membership);

  if (referrerMember) {
    const settings = freshDb.gym_settings;
    const rewardType = settings.referral_reward_type;
    const rewardValue = settings.referral_reward_value;
    const refRecord: Referral = {
      id: crypto.randomUUID(),
      referrer_member_id: referrerMember.id,
      referred_member_id: member.id,
      transaction_id: tx.id,
      reward_type: rewardType,
      reward_value: rewardValue,
      status: "granted",
      created_at: new Date().toISOString(),
    };
    freshDb.referrals = freshDb.referrals || [];
    freshDb.referrals.push(refRecord);

    if (rewardType === "days" && rewardValue > 0) {
      const refMs = freshDb.memberships.filter(
        (m) => m.member_id === referrerMember!.id
      );
      const { startDate: rStart, endDate: rEnd } = calculateRenewalDates(
        rewardValue,
        refMs
      );
      freshDb.memberships.push({
        id: crypto.randomUUID(),
        member_id: referrerMember.id,
        package_id: pkg.id,
        transaction_id: tx.id,
        start_date: rStart,
        end_date: rEnd,
        status: "active",
        created_at: new Date().toISOString(),
      });
    } else if (rewardType === "discount_balance" && rewardValue > 0) {
      const rIdx = freshDb.members.findIndex((m) => m.id === referrerMember!.id);
      if (rIdx !== -1) {
        freshDb.members[rIdx].discount_balance =
          (freshDb.members[rIdx].discount_balance || 0) + rewardValue;
      }
    }
  }

  writeLocalDb(freshDb);

  addActivityLog(actor.id, "create_transaction", "transaction", tx.id, {
    invoice_number: tx.invoice_number,
    type: tx.type,
    total: tx.total,
  });

  return { member, transaction: tx, membership };
}

export function processRenewalTransaction(
  actor: SafeStaffUser,
  input: {
    memberId: string;
    packageId: string;
    discount?: number;
    discountReason?: string;
    promotionId?: string | null;
    promoCode?: string | null;
    referralCode?: string | null;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }
): { transaction: Transaction; membership: Membership } {
  const shift = getOpenShiftForCashier(actor.id);
  if (!shift) {
    throw new Error("Buka shift terlebih dahulu sebelum membuat transaksi.");
  }

  const db = readLocalDb();
  const member = db.members.find((m) => m.id === input.memberId);
  if (!member) throw new Error("Member tidak ditemukan.");
  if (!member.is_active) {
    throw new Error("Member berstatus nonaktif. Aktifkan kembali sebelum perpanjangan.");
  }

  const pkg = db.packages.find((p) => p.id === input.packageId && p.is_active);
  if (!pkg || pkg.type !== "membership") {
    throw new Error("Paket membership tidak valid atau tidak aktif.");
  }

  let discount = Math.round(input.discount ?? 0);
  let discountReason = input.discountReason;
  let appliedPromoId: string | null = null;
  let referrerMember: Member | null = null;

  if (input.referralCode && input.referralCode.trim()) {
    if (!db.gym_settings.referral_enabled) {
      throw new Error("Program referral sedang dinonaktifkan.");
    }
    const refCode = input.referralCode.trim().toUpperCase();
    referrerMember =
      db.members.find(
        (m) => m.is_active && m.referral_code?.toUpperCase() === refCode
      ) ?? null;
    if (!referrerMember) {
      throw new Error("Kode referral tidak ditemukan atau member pengajak tidak aktif.");
    }
    if (!input.promotionId && !input.promoCode && discount === 0) {
      discount = db.gym_settings.referral_discount_amount;
      discountReason = `Referral: ${referrerMember.referral_code}`;
    }
  }

  if (input.promotionId || input.promoCode) {
    const res = validatePromotion({
      promotionId: input.promotionId,
      promoCode: input.promoCode,
      isNewMember: false,
      memberId: member.id,
      packageId: pkg.id,
      subtotal: pkg.price,
    });
    appliedPromoId = res.promotion.id;
    discount = res.discountAmount;
    discountReason = `Promo: ${res.promotion.name}`;
  }

  // Biaya pendaftaran hanya dikenakan pada pendaftaran pertama (Aturan Bisnis)
  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    discountReason,
    pkg.price,
    input.paymentMethod,
    input.cashReceived,
    Boolean(appliedPromoId) || Boolean(referrerMember)
  );

  const existingMemberships = db.memberships.filter(
    (m) => m.member_id === member.id
  );
  const { startDate, endDate } = calculateRenewalDates(
    pkg.duration_days,
    existingMemberships
  );

  const tx: Transaction = {
    id: crypto.randomUUID(),
    invoice_number: nextInvoiceNumber(),
    type: "renewal",
    member_id: member.id,
    guest_name: null,
    guest_phone: null,
    package_id: pkg.id,
    package_price: pkg.price,
    registration_fee: 0,
    discount,
    discount_reason: discount > 0 ? discountReason?.trim() || null : null,
    promotion_id: appliedPromoId,
    total,
    payment_method: input.paymentMethod,
    cash_received: cashReceivedVal,
    change_amount: changeAmount,
    cashier_id: actor.id,
    shift_id: shift.id,
    status: "paid",
    void_reason: null,
    voided_by: null,
    voided_at: null,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  const membership: Membership = {
    id: crypto.randomUUID(),
    member_id: member.id,
    package_id: pkg.id,
    transaction_id: tx.id,
    start_date: startDate,
    end_date: endDate,
    status: "active",
    created_at: new Date().toISOString(),
  };

  db.transactions.push(tx);
  db.memberships.push(membership);
  writeLocalDb(db);

  addActivityLog(actor.id, "create_transaction", "transaction", tx.id, {
    invoice_number: tx.invoice_number,
    type: tx.type,
    total: tx.total,
  });

  return { transaction: tx, membership };
}

export function processDailyTicketTransaction(
  actor: SafeStaffUser,
  input: {
    guestName: string;
    guestPhone: string;
    packageId: string;
    discount?: number;
    discountReason?: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }
): { transaction: Transaction; checkin: Checkin } {
  const shift = getOpenShiftForCashier(actor.id);
  if (!shift) {
    throw new Error("Buka shift terlebih dahulu sebelum membuat transaksi.");
  }

  const db = readLocalDb();
  const pkg = db.packages.find((p) => p.id === input.packageId && p.is_active);
  if (!pkg || pkg.type !== "daily") {
    throw new Error("Paket tiket harian tidak valid atau tidak aktif.");
  }

  const discount = Math.round(input.discount ?? 0);
  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    input.discountReason,
    pkg.price,
    input.paymentMethod,
    input.cashReceived
  );

  const nowIso = new Date().toISOString();
  const tx: Transaction = {
    id: crypto.randomUUID(),
    invoice_number: nextInvoiceNumber(),
    type: "daily",
    member_id: null,
    guest_name: input.guestName.trim(),
    guest_phone: input.guestPhone.trim(),
    package_id: pkg.id,
    package_price: pkg.price,
    registration_fee: 0,
    discount,
    discount_reason: discount > 0 ? input.discountReason?.trim() || null : null,
    promotion_id: null,
    total,
    payment_method: input.paymentMethod,
    cash_received: cashReceivedVal,
    change_amount: changeAmount,
    cashier_id: actor.id,
    shift_id: shift.id,
    status: "paid",
    void_reason: null,
    voided_by: null,
    voided_at: null,
    notes: input.notes?.trim() || null,
    created_at: nowIso,
  };

  // FR-37: Tiket harian otomatis membuat catatan check-in
  const checkin: Checkin = {
    id: crypto.randomUUID(),
    member_id: null,
    transaction_id: tx.id,
    checked_in_at: nowIso,
    method: "daily",
    is_duplicate: false,
    cashier_id: actor.id,
  };

  db.transactions.push(tx);
  db.checkins.push(checkin);
  writeLocalDb(db);

  addActivityLog(actor.id, "create_transaction", "transaction", tx.id, {
    invoice_number: tx.invoice_number,
    type: tx.type,
    total: tx.total,
  });

  return { transaction: tx, checkin };
}

export function voidTransaction(
  actor: SafeStaffUser,
  transactionId: string,
  reason: string
): Transaction {
  if (actor.role !== "owner") {
    throw new Error("Hanya owner yang dapat membatalkan (void) transaksi.");
  }
  if (!reason.trim()) {
    throw new Error("Alasan void wajib diisi.");
  }

  const db = readLocalDb();
  const idx = db.transactions.findIndex((t) => t.id === transactionId);
  if (idx === -1) throw new Error("Transaksi tidak ditemukan.");
  if (db.transactions[idx].status === "void") {
    throw new Error("Transaksi sudah berstatus void.");
  }

  const nowIso = new Date().toISOString();
  db.transactions[idx] = {
    ...db.transactions[idx],
    status: "void",
    void_reason: reason.trim(),
    voided_by: actor.id,
    voided_at: nowIso,
  };

  // FR-25: Tandai membership terkait sebagai void agar masa aktif member dihitung ulang
  for (let i = 0; i < db.memberships.length; i++) {
    if (db.memberships[i].transaction_id === transactionId) {
      db.memberships[i].status = "void";
    }
  }

  // Kembalikan stok produk jika transaksi memiliki item produk (Fase 2A - Fitur 2)
  const items = (db.transaction_items || []).filter(
    (it) => it.transaction_id === transactionId && it.item_type === "product"
  );
  for (const item of items) {
    const pIdx = (db.products || []).findIndex((p) => p.id === item.item_id);
    if (pIdx !== -1) {
      db.products[pIdx].stock += item.qty;
      db.stock_movements = db.stock_movements || [];
      db.stock_movements.unshift({
        id: crypto.randomUUID(),
        product_id: item.item_id,
        type: "void",
        qty: item.qty,
        reason: `Void ${db.transactions[idx].invoice_number}: ${reason.trim()}`,
        reference_id: transactionId,
        user_id: actor.id,
        created_at: nowIso,
      });
    }
  }

  // Batalkan bonus referral jika transaksi di-void (Fase 2A - Fitur 5)
  for (let i = 0; i < (db.referrals || []).length; i++) {
    const ref = db.referrals[i];
    if (ref.transaction_id === transactionId && ref.status === "granted") {
      db.referrals[i].status = "cancelled";
      if (ref.reward_type === "discount_balance") {
        const mIdx = db.members.findIndex((m) => m.id === ref.referrer_member_id);
        if (mIdx !== -1) {
          db.members[mIdx].discount_balance = Math.max(
            0,
            (db.members[mIdx].discount_balance || 0) - ref.reward_value
          );
        }
      }
    }
  }

  writeLocalDb(db);
  addActivityLog(actor.id, "void_transaction", "transaction", transactionId, {
    invoice_number: db.transactions[idx].invoice_number,
    reason: reason.trim(),
  });

  return db.transactions[idx];
}

// ============================================================================
// Check-in
// ============================================================================
export function recordMemberCheckin(
  actor: SafeStaffUser,
  memberId: string,
  method: Exclude<CheckinMethod, "daily">
): {
  member: MemberWithStatus;
  checkin: Checkin | null;
  allowed: boolean;
  is_duplicate: boolean;
  message: string;
} {
  const member = getMemberById(memberId);
  if (!member) throw new Error("Member tidak ditemukan.");

  if (!member.status_info.can_checkin) {
    return {
      member,
      checkin: null,
      allowed: false,
      is_duplicate: false,
      message:
        member.status_info.status === "frozen"
          ? "Membership sedang dalam status Freeze / Cuti. Check-in tidak diizinkan."
          : member.status_info.status === "inactive"
          ? "Akun member berstatus Nonaktif."
          : member.status_info.status === "not_started"
          ? "Membership member belum dimulai."
          : "Masa aktif membership sudah habis. Silakan lakukan perpanjangan.",
    };
  }

  const db = readLocalDb();
  const todayStr = getJakartaTodayStr();
  const alreadyToday = db.checkins.some((c) => {
    if (c.member_id !== member.id) return false;
    const cDate = getJakartaTodayStr(new Date(c.checked_in_at));
    return cDate === todayStr;
  });

  const checkin: Checkin = {
    id: crypto.randomUUID(),
    member_id: member.id,
    transaction_id: null,
    checked_in_at: new Date().toISOString(),
    method,
    is_duplicate: alreadyToday,
    cashier_id: actor.id,
  };

  db.checkins.push(checkin);
  writeLocalDb(db);

  return {
    member,
    checkin,
    allowed: true,
    is_duplicate: alreadyToday,
    message: alreadyToday
      ? "Check-in berhasil (duplikat: member sudah check-in hari ini)."
      : "Check-in berhasil dicatat.",
  };
}

// ============================================================================
// Freeze / Cuti Membership (Fase 2A - Fitur 1)
// ============================================================================
export function listFreezes() {
  const db = readLocalDb();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  return [...(db.freezes || [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((f) => ({
      ...f,
      member_name: memberMap.get(f.member_id)?.full_name || "-",
      member_code: memberMap.get(f.member_id)?.member_code || "-",
    }));
}

export function requestFreeze(
  actor: SafeStaffUser,
  input: {
    memberId: string;
    startDate: string;
    endDate: string;
    reason: FreezeReason;
    reasonNotes?: string;
    attachmentUrl?: string;
  }
): Freeze {
  const db = readLocalDb();
  const settings = db.gym_settings;
  if (!settings.freeze_allowed) {
    throw new Error("Fitur freeze / cuti membership sedang dinonaktifkan oleh owner.");
  }

  const member = getMemberById(input.memberId);
  if (!member) throw new Error("Member tidak ditemukan.");
  if (!member.is_active) throw new Error("Member berstatus nonaktif.");
  if (
    member.status_info.status !== "active" &&
    member.status_info.status !== "expiring"
  ) {
    throw new Error("Hanya member aktif yang dapat mengajukan freeze.");
  }

  const days = calculateFreezeDays(input.startDate, input.endDate);
  if (days <= 0) {
    throw new Error("Tanggal selesai freeze harus sama atau setelah tanggal mulai.");
  }
  if (days < settings.freeze_min_days) {
    throw new Error(`Durasi freeze minimal ${settings.freeze_min_days} hari.`);
  }
  if (days > settings.freeze_max_days) {
    throw new Error(`Durasi freeze maksimal ${settings.freeze_max_days} hari per pengajuan.`);
  }

  const activeMemberships = db.memberships
    .filter((m) => m.member_id === member.id && m.status === "active")
    .sort((a, b) => b.end_date.localeCompare(a.end_date));
  const latestMs = activeMemberships[0];
  if (!latestMs) {
    throw new Error("Membership aktif tidak ditemukan.");
  }

  const existingActive = (db.freezes || []).find(
    (f) => f.member_id === member.id && f.status === "active"
  );
  if (existingActive) {
    throw new Error("Member masih memiliki pengajuan freeze yang sedang aktif.");
  }

  const usedDaysInPeriod = (db.freezes || [])
    .filter((f) => f.membership_id === latestMs.id && f.status !== "cancelled")
    .reduce((sum, f) => sum + computeEffectiveFreezeDays(f), 0);

  if (usedDaysInPeriod + days > settings.freeze_max_days_per_period) {
    throw new Error(
      `Total hari freeze melebihi batas ${settings.freeze_max_days_per_period} hari per periode membership.`
    );
  }

  const freeze: Freeze = {
    id: crypto.randomUUID(),
    member_id: member.id,
    membership_id: latestMs.id,
    start_date: input.startDate,
    end_date: input.endDate,
    actual_end_date: null,
    reason: input.reason,
    reason_notes: input.reasonNotes?.trim() || null,
    attachment_url: input.attachmentUrl?.trim() || null,
    fee: settings.freeze_fee,
    status: "active",
    cancel_reason: null,
    created_by: actor.id,
    created_at: new Date().toISOString(),
  };

  db.freezes = db.freezes || [];
  db.freezes.push(freeze);
  writeLocalDb(db);

  addActivityLog(actor.id, "request_freeze", "freeze", freeze.id, {
    member_id: member.id,
    days,
    reason: input.reason,
  });

  return freeze;
}

export function finishFreezeEarly(
  actor: SafeStaffUser,
  freezeId: string,
  actualEndDate: string = getJakartaTodayStr()
): Freeze {
  const db = readLocalDb();
  const idx = (db.freezes || []).findIndex((f) => f.id === freezeId);
  if (idx === -1) throw new Error("Data freeze tidak ditemukan.");
  const freeze = db.freezes[idx];
  if (freeze.status !== "active") {
    throw new Error("Hanya freeze berstatus aktif yang dapat diakhiri.");
  }
  if (actualEndDate > freeze.end_date) {
    throw new Error("Tanggal pengakhiran lebih awal tidak boleh melewati tanggal selesai awal.");
  }

  db.freezes[idx] = {
    ...freeze,
    status: "finished",
    actual_end_date: actualEndDate,
  };
  writeLocalDb(db);

  addActivityLog(actor.id, "finish_freeze_early", "freeze", freezeId, {
    actual_end_date: actualEndDate,
  });

  return db.freezes[idx];
}

export function cancelFreeze(
  actor: SafeStaffUser,
  freezeId: string,
  reason: string
): Freeze {
  if (actor.role !== "owner") {
    throw new Error("Hanya owner yang dapat membatalkan freeze.");
  }
  if (!reason.trim()) {
    throw new Error("Alasan pembatalan wajib diisi.");
  }
  const db = readLocalDb();
  const idx = (db.freezes || []).findIndex((f) => f.id === freezeId);
  if (idx === -1) throw new Error("Data freeze tidak ditemukan.");
  if (db.freezes[idx].status === "cancelled") {
    throw new Error("Freeze sudah dibatalkan.");
  }

  db.freezes[idx] = {
    ...db.freezes[idx],
    status: "cancelled",
    cancel_reason: reason.trim(),
  };
  writeLocalDb(db);

  addActivityLog(actor.id, "cancel_freeze", "freeze", freezeId, {
    reason: reason.trim(),
  });

  return db.freezes[idx];
}

// ============================================================================
// POS Produk & Stok (Fase 2A - Fitur 2)
// ============================================================================
export function listProducts(activeOnly = false): Product[] {
  const prods = readLocalDb().products || [];
  return activeOnly ? prods.filter((p) => p.is_active) : prods;
}

export function createProduct(
  actorId: string,
  input: {
    name: string;
    category: ProductCategory;
    sku?: string | null;
    sell_price: number;
    cost_price: number;
    stock: number;
    min_stock: number;
    is_active?: boolean;
  }
): Product {
  const db = readLocalDb();
  db.products = db.products || [];
  const cleanSku = input.sku?.trim() || null;
  if (cleanSku && db.products.some((p) => p.sku === cleanSku)) {
    throw new Error(`SKU/Barcode ${cleanSku} sudah digunakan produk lain.`);
  }
  const prod: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    category: input.category,
    sku: cleanSku,
    sell_price: Math.round(input.sell_price),
    cost_price: Math.round(input.cost_price),
    stock: Math.round(input.stock),
    min_stock: Math.round(input.min_stock),
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
  };
  db.products.push(prod);
  if (prod.stock > 0) {
    db.stock_movements = db.stock_movements || [];
    db.stock_movements.unshift({
      id: crypto.randomUUID(),
      product_id: prod.id,
      type: "in",
      qty: prod.stock,
      reason: "Stok awal produk",
      reference_id: null,
      user_id: actorId,
      created_at: new Date().toISOString(),
    });
  }
  writeLocalDb(db);
  addActivityLog(actorId, "create_product", "product", prod.id, {
    name: prod.name,
    sell_price: prod.sell_price,
  });
  return prod;
}

export function updateProduct(
  actorId: string,
  productId: string,
  patch: Partial<Omit<Product, "id" | "created_at" | "stock">>
): Product {
  const db = readLocalDb();
  const idx = (db.products || []).findIndex((p) => p.id === productId);
  if (idx === -1) throw new Error("Produk tidak ditemukan.");
  if (patch.sku) {
    const dup = db.products.find(
      (p) => p.id !== productId && p.sku === patch.sku?.trim()
    );
    if (dup) throw new Error("SKU/Barcode sudah digunakan produk lain.");
  }
  db.products[idx] = { ...db.products[idx], ...patch };
  writeLocalDb(db);
  addActivityLog(actorId, "update_product", "product", productId, patch);
  return db.products[idx];
}

export function listStockMovements() {
  const db = readLocalDb();
  const prodMap = new Map((db.products || []).map((p) => [p.id, p]));
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));
  return [...(db.stock_movements || [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((m) => ({
      ...m,
      product_name: prodMap.get(m.product_id)?.name || "-",
      user_name: m.user_id ? userMap.get(m.user_id) || "Staff" : "Sistem",
    }));
}

export function recordStockMovement(
  actor: SafeStaffUser,
  input: {
    productId: string;
    type: "in" | "adjustment";
    qty: number; // positif untuk masuk, bisa negatif/positif untuk adjustment
    reason: string;
  }
): Product {
  if (actor.role !== "owner") {
    throw new Error("Hanya owner yang dapat mencatat stok masuk atau penyesuaian stok.");
  }
  if (!input.reason.trim()) {
    throw new Error("Alasan wajib diisi.");
  }
  if (input.type === "in" && input.qty <= 0) {
    throw new Error("Jumlah stok masuk harus lebih dari 0.");
  }
  if (input.qty === 0) {
    throw new Error("Jumlah perubahan stok tidak boleh 0.");
  }

  const db = readLocalDb();
  const idx = (db.products || []).findIndex((p) => p.id === input.productId);
  if (idx === -1) throw new Error("Produk tidak ditemukan.");

  const newStock = db.products[idx].stock + Math.round(input.qty);
  if (newStock < 0) {
    throw new Error("Stok akhir tidak boleh kurang dari 0.");
  }

  db.products[idx].stock = newStock;
  db.stock_movements = db.stock_movements || [];
  db.stock_movements.unshift({
    id: crypto.randomUUID(),
    product_id: input.productId,
    type: input.type,
    qty: Math.round(input.qty),
    reason: input.reason.trim(),
    reference_id: null,
    user_id: actor.id,
    created_at: new Date().toISOString(),
  });
  writeLocalDb(db);

  addActivityLog(actor.id, `stock_${input.type}`, "product", input.productId, {
    qty: input.qty,
    reason: input.reason.trim(),
    new_stock: newStock,
  });

  return db.products[idx];
}

export function processPosTransaction(
  actor: SafeStaffUser,
  input: {
    memberId?: string | null;
    guestName?: string | null;
    guestPhone?: string | null;
    items: { productId: string; qty: number }[];
    packageId?: string | null;
    discount?: number;
    discountReason?: string;
    promotionId?: string | null;
    promoCode?: string | null;
    referralCode?: string | null;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }
): { transaction: Transaction; items: TransactionItem[]; membership: Membership | null } {
  const shift = getOpenShiftForCashier(actor.id);
  if (!shift) {
    throw new Error("Buka shift terlebih dahulu sebelum membuat transaksi POS.");
  }
  if (input.items.length === 0 && !input.packageId) {
    throw new Error("Keranjang belanja tidak boleh kosong.");
  }

  const db = readLocalDb();
  let member: Member | null = null;
  if (input.memberId) {
    member = db.members.find((m) => m.id === input.memberId) ?? null;
    if (!member) throw new Error("Member tidak ditemukan.");
  }

  let pkg: Package | null = null;
  if (input.packageId) {
    pkg = db.packages.find((p) => p.id === input.packageId && p.is_active) ?? null;
    if (!pkg) throw new Error("Paket tidak valid atau tidak aktif.");
    if (pkg.type === "membership" && !member) {
      throw new Error("Pilih member terlebih dahulu untuk pembelian paket membership.");
    }
  }

  const preparedItems: Omit<TransactionItem, "id" | "transaction_id">[] = [];
  let subtotal = 0;

  if (pkg) {
    preparedItems.push({
      item_type: "package",
      item_id: pkg.id,
      name: pkg.name,
      qty: 1,
      unit_price: pkg.price,
      cost_price: 0,
      discount: 0,
      subtotal: pkg.price,
    });
    subtotal += pkg.price;
  }

  for (const cartItem of input.items) {
    if (cartItem.qty < 1) throw new Error("Jumlah item minimal 1.");
    const prod = (db.products || []).find(
      (p) => p.id === cartItem.productId && p.is_active
    );
    if (!prod) throw new Error("Produk tidak ditemukan atau tidak aktif.");
    if (prod.stock < cartItem.qty) {
      throw new Error(`Stok ${prod.name} tidak mencukupi (tersedia ${prod.stock}).`);
    }
    const lineSub = prod.sell_price * cartItem.qty;
    preparedItems.push({
      item_type: "product",
      item_id: prod.id,
      name: prod.name,
      qty: cartItem.qty,
      unit_price: prod.sell_price,
      cost_price: prod.cost_price,
      discount: 0,
      subtotal: lineSub,
    });
    subtotal += lineSub;
  }

  let discount = Math.round(input.discount ?? 0);
  let discountReason = input.discountReason;
  let appliedPromoId: string | null = null;
  let referrerMember: Member | null = null;

  if (input.referralCode && input.referralCode.trim()) {
    if (!db.gym_settings.referral_enabled) {
      throw new Error("Program referral sedang dinonaktifkan.");
    }
    const refCode = input.referralCode.trim().toUpperCase();
    referrerMember =
      db.members.find(
        (m) => m.is_active && m.referral_code?.toUpperCase() === refCode
      ) ?? null;
    if (!referrerMember) {
      throw new Error("Kode referral tidak ditemukan atau member pengajak tidak aktif.");
    }
    if (!input.promotionId && !input.promoCode && discount === 0) {
      discount = db.gym_settings.referral_discount_amount;
      discountReason = `Referral: ${referrerMember.referral_code}`;
    }
  }

  if (input.promotionId || input.promoCode) {
    const res = validatePromotion({
      promotionId: input.promotionId,
      promoCode: input.promoCode,
      isNewMember: false,
      memberId: member ? member.id : null,
      packageId: pkg ? pkg.id : null,
      productIds: input.items.map((i) => i.productId),
      subtotal,
    });
    appliedPromoId = res.promotion.id;
    discount = res.discountAmount;
    discountReason = `Promo: ${res.promotion.name}`;
  }

  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    discountReason,
    subtotal,
    input.paymentMethod,
    input.cashReceived,
    Boolean(appliedPromoId) || Boolean(referrerMember)
  );

  const txType = pkg && input.items.length > 0 ? "mixed" : pkg ? (pkg.type === "daily" ? "daily" : "renewal") : "pos";
  const nowIso = new Date().toISOString();

  const tx: Transaction = {
    id: crypto.randomUUID(),
    invoice_number: nextInvoiceNumber(),
    type: txType,
    member_id: member ? member.id : null,
    guest_name: member ? null : input.guestName?.trim() || "Pembeli Umum",
    guest_phone: member ? null : input.guestPhone?.trim() || null,
    package_id: pkg ? pkg.id : null,
    package_price: pkg ? pkg.price : 0,
    registration_fee: 0,
    discount,
    discount_reason: discount > 0 ? discountReason?.trim() || null : null,
    promotion_id: appliedPromoId,
    total,
    payment_method: input.paymentMethod,
    cash_received: cashReceivedVal,
    change_amount: changeAmount,
    cashier_id: actor.id,
    shift_id: shift.id,
    status: "paid",
    void_reason: null,
    voided_by: null,
    voided_at: null,
    notes: input.notes?.trim() || null,
    created_at: nowIso,
  };

  db.transactions.push(tx);
  db.transaction_items = db.transaction_items || [];
  db.stock_movements = db.stock_movements || [];

  const createdItems: TransactionItem[] = [];
  for (const item of preparedItems) {
    const ti: TransactionItem = {
      ...item,
      id: crypto.randomUUID(),
      transaction_id: tx.id,
    };
    db.transaction_items.push(ti);
    createdItems.push(ti);

    if (item.item_type === "product") {
      const pIdx = db.products.findIndex((p) => p.id === item.item_id);
      if (pIdx !== -1) {
        db.products[pIdx].stock -= item.qty;
        db.stock_movements.unshift({
          id: crypto.randomUUID(),
          product_id: item.item_id,
          type: "sale",
          qty: -item.qty,
          reason: `Penjualan ${tx.invoice_number}`,
          reference_id: tx.id,
          user_id: actor.id,
          created_at: nowIso,
        });
      }
    }
  }

  let createdMembership: Membership | null = null;
  if (pkg && pkg.type === "membership" && member) {
    const existing = db.memberships.filter((m) => m.member_id === member!.id);
    const { startDate, endDate } = calculateRenewalDates(
      pkg.duration_days,
      existing
    );
    createdMembership = {
      id: crypto.randomUUID(),
      member_id: member.id,
      package_id: pkg.id,
      transaction_id: tx.id,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      created_at: nowIso,
    };
    db.memberships.push(createdMembership);
  } else if (pkg && pkg.type === "daily") {
    db.checkins.push({
      id: crypto.randomUUID(),
      member_id: member ? member.id : null,
      transaction_id: tx.id,
      checked_in_at: nowIso,
      method: "daily",
      is_duplicate: false,
      cashier_id: actor.id,
    });
  }

  writeLocalDb(db);
  addActivityLog(actor.id, "create_pos_transaction", "transaction", tx.id, {
    invoice_number: tx.invoice_number,
    type: tx.type,
    total: tx.total,
    item_count: createdItems.length,
  });

  return { transaction: tx, items: createdItems, membership: createdMembership };
}

// ============================================================================
// Pengeluaran & Laba Rugi (Fase 2A - Fitur 3)
// ============================================================================
export function listExpenses(cashierId?: string) {
  const db = readLocalDb();
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));
  const rows = (db.expenses || []).filter((e) =>
    cashierId ? e.created_by === cashierId : true
  );
  return [...rows]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((e) => ({
      ...e,
      creator_name: e.created_by ? userMap.get(e.created_by) || "Staff" : "-",
    }));
}

export function createExpense(
  actor: SafeStaffUser,
  input: {
    category: ExpenseCategory;
    amount: number;
    paymentMethod: PaymentMethod;
    date?: string;
    notes?: string;
    receiptUrl?: string;
  }
): Expense {
  const db = readLocalDb();
  if (actor.role === "cashier" && !db.gym_settings.cashier_can_record_expense) {
    throw new Error("Owner tidak mengizinkan kasir mencatat pengeluaran.");
  }
  if (input.amount <= 0) {
    throw new Error("Nominal pengeluaran harus lebih dari 0.");
  }

  let shiftId: string | null = null;
  if (input.paymentMethod === "cash") {
    const openShift = getOpenShiftForCashier(actor.id);
    if (actor.role === "cashier" && !openShift) {
      throw new Error(
        "Kasir harus membuka shift terlebih dahulu untuk mencatat pengeluaran tunai."
      );
    }
    if (openShift) shiftId = openShift.id;
  }

  const expense: Expense = {
    id: crypto.randomUUID(),
    category: input.category,
    amount: Math.round(input.amount),
    payment_method: input.paymentMethod,
    date: input.date || getJakartaTodayStr(),
    notes: input.notes?.trim() || null,
    receipt_url: input.receiptUrl?.trim() || null,
    shift_id: shiftId,
    status: "active",
    created_by: actor.id,
    created_at: new Date().toISOString(),
  };

  db.expenses = db.expenses || [];
  db.expenses.push(expense);
  writeLocalDb(db);

  addActivityLog(actor.id, "create_expense", "expense", expense.id, {
    category: expense.category,
    amount: expense.amount,
    payment_method: expense.payment_method,
  });

  return expense;
}

export function voidExpense(actor: SafeStaffUser, expenseId: string): Expense {
  if (actor.role !== "owner") {
    throw new Error("Hanya owner yang dapat membatalkan pengeluaran.");
  }
  const db = readLocalDb();
  const idx = (db.expenses || []).findIndex((e) => e.id === expenseId);
  if (idx === -1) throw new Error("Data pengeluaran tidak ditemukan.");
  db.expenses[idx].status = "void";
  writeLocalDb(db);
  addActivityLog(actor.id, "void_expense", "expense", expenseId, {});
  return db.expenses[idx];
}

export function getProfitLossReport(from?: string, to?: string) {
  const db = readLocalDb();
  const paidTxs = db.transactions.filter((t) => {
    if (t.status !== "paid") return false;
    const d = getJakartaTodayStr(new Date(t.created_at));
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  let membershipRevenue = 0;
  let dailyRevenue = 0;
  let productRevenue = 0;
  let cogs = 0;

  const itemsByTx = new Map<string, TransactionItem[]>();
  for (const it of db.transaction_items || []) {
    const arr = itemsByTx.get(it.transaction_id) ?? [];
    arr.push(it);
    itemsByTx.set(it.transaction_id, arr);
  }

  for (const tx of paidTxs) {
    const txItems = itemsByTx.get(tx.id);
    if (txItems && txItems.length > 0) {
      // Hitung per item (dikurangi proporsi diskon jika ada)
      const grossSum = txItems.reduce((s, x) => s + x.subtotal, 0);
      const ratio = grossSum > 0 ? tx.total / grossSum : 1;
      for (const it of txItems) {
        const netItem = Math.round(it.subtotal * ratio);
        if (it.item_type === "product") {
          productRevenue += netItem;
          cogs += it.cost_price * it.qty;
        } else if (tx.type === "daily") {
          dailyRevenue += netItem;
        } else {
          membershipRevenue += netItem;
        }
      }
    } else {
      if (tx.type === "daily") dailyRevenue += tx.total;
      else if (tx.type === "pos") productRevenue += tx.total;
      else membershipRevenue += tx.total;
    }
  }

  const totalRevenue = paidTxs.reduce((s, t) => s + t.total, 0);

  const activeExpenses = (db.expenses || []).filter((e) => {
    if (e.status !== "active") return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });

  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;
  for (const e of activeExpenses) {
    expensesByCategory[e.category] =
      (expensesByCategory[e.category] || 0) + e.amount;
    totalExpenses += e.amount;
  }

  const netProfit = totalRevenue - cogs - totalExpenses;

  return {
    revenue: {
      membership: membershipRevenue,
      daily: dailyRevenue,
      products: productRevenue,
      total: totalRevenue,
    },
    cogs,
    expenses: {
      total: totalExpenses,
      by_category: expensesByCategory,
    },
    net_profit: netProfit,
  };
}

// ============================================================================
// Promo & Voucher (Fase 2A - Fitur 4)
// ============================================================================
export function listPromotions(activeOnly = false): Promotion[] {
  const promos = readLocalDb().promotions || [];
  return activeOnly ? promos.filter((p) => p.is_active) : promos;
}

export function createPromotion(
  actorId: string,
  input: Omit<Promotion, "id" | "created_at">
): Promotion {
  const db = readLocalDb();
  db.promotions = db.promotions || [];
  const cleanCode = input.code?.trim().toUpperCase() || null;
  if (cleanCode && db.promotions.some((p) => p.code === cleanCode)) {
    throw new Error(`Kode voucher ${cleanCode} sudah digunakan.`);
  }
  const promo: Promotion = {
    ...input,
    id: crypto.randomUUID(),
    code: cleanCode,
    created_at: new Date().toISOString(),
  };
  db.promotions.push(promo);
  writeLocalDb(db);
  addActivityLog(actorId, "create_promotion", "promotion", promo.id, {
    name: promo.name,
    code: promo.code,
  });
  return promo;
}

export function updatePromotion(
  actorId: string,
  promoId: string,
  patch: Partial<Omit<Promotion, "id" | "created_at">>
): Promotion {
  const db = readLocalDb();
  const idx = (db.promotions || []).findIndex((p) => p.id === promoId);
  if (idx === -1) throw new Error("Promo tidak ditemukan.");
  db.promotions[idx] = { ...db.promotions[idx], ...patch };
  writeLocalDb(db);
  addActivityLog(actorId, "update_promotion", "promotion", promoId, patch);
  return db.promotions[idx];
}

export function validatePromotion(input: {
  promotionId?: string | null;
  promoCode?: string | null;
  isNewMember: boolean;
  memberId?: string | null;
  packageId?: string | null;
  productIds?: string[];
  subtotal: number;
  todayStr?: string;
}): { promotion: Promotion; discountAmount: number } {
  const db = readLocalDb();
  const today = input.todayStr || getJakartaTodayStr();
  const promos = db.promotions || [];

  let promo: Promotion | undefined;
  if (input.promotionId) {
    promo = promos.find((p) => p.id === input.promotionId);
  } else if (input.promoCode) {
    const code = input.promoCode.trim().toUpperCase();
    promo = promos.find((p) => p.code && p.code.toUpperCase() === code);
  }

  if (!promo) throw new Error("Kode promo / voucher tidak ditemukan.");
  if (!promo.is_active) throw new Error("Promo sedang tidak aktif.");
  if (today < promo.start_date) throw new Error("Periode promo belum dimulai.");
  if (today > promo.end_date) throw new Error("Promo sudah kedaluwarsa.");
  if (promo.new_member_only && !input.isNewMember) {
    throw new Error("Promo ini hanya berlaku untuk pendaftaran member baru.");
  }

  if (promo.applies_to === "package") {
    if (!input.packageId) {
      throw new Error("Promo ini hanya berlaku untuk pembelian paket membership.");
    }
    if (
      promo.target_ids.length > 0 &&
      !promo.target_ids.includes(input.packageId)
    ) {
      throw new Error("Promo tidak berlaku untuk paket yang dipilih.");
    }
  } else if (promo.applies_to === "product") {
    const prodIds = input.productIds || [];
    if (prodIds.length === 0) {
      throw new Error("Promo ini hanya berlaku untuk pembelian produk POS.");
    }
    if (
      promo.target_ids.length > 0 &&
      !prodIds.some((id) => promo!.target_ids.includes(id))
    ) {
      throw new Error("Promo tidak berlaku untuk produk yang dipilih.");
    }
  }

  const paidWithPromo = db.transactions.filter(
    (t) => t.status === "paid" && t.promotion_id === promo!.id
  );
  if (promo.max_quota !== null && paidWithPromo.length >= promo.max_quota) {
    throw new Error("Kuota promo sudah habis.");
  }
  if (
    promo.max_per_member !== null &&
    input.memberId &&
    paidWithPromo.filter((t) => t.member_id === input.memberId).length >=
      promo.max_per_member
  ) {
    throw new Error("Member sudah mencapai batas maksimal pemakaian promo ini.");
  }

  const discountAmount =
    promo.discount_type === "percent"
      ? Math.round((input.subtotal * promo.discount_value) / 100)
      : Math.min(input.subtotal, promo.discount_value);

  return { promotion: promo, discountAmount };
}

export function getPromotionsReport() {
  const db = readLocalDb();
  const paid = db.transactions.filter(
    (t) => t.status === "paid" && t.promotion_id
  );
  return (db.promotions || []).map((p) => {
    const used = paid.filter((t) => t.promotion_id === p.id);
    return {
      ...p,
      usage_count: used.length,
      total_discount: used.reduce((s, t) => s + t.discount, 0),
    };
  });
}
