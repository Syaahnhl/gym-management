import crypto from "crypto";
import {
  calculateRegistrationDates,
  calculateRenewalDates,
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
  GymSettings,
  Member,
  MemberStatusInfo,
  Membership,
  Package,
  PaymentMethod,
  SafeStaffUser,
  Shift,
  StaffRole,
  Transaction,
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
  const status_info = computeMemberStatus(
    member,
    memberShips,
    db.gym_settings.reminder_days
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
  const reminderDays = db.gym_settings.reminder_days;
  const todayStr = getJakartaTodayStr();
  return db.members.map((m) => ({
    ...m,
    status_info: computeMemberStatus(m, byMember.get(m.id) ?? [], reminderDays, todayStr),
  }));
}

export function getMemberById(id: string): MemberWithStatus | null {
  const member = readLocalDb().members.find((m) => m.id === id);
  return member ? enrichMemberWithStatus(member) : null;
}

export function getMemberByCodeOrPhone(query: string): MemberWithStatus | null {
  const q = query.trim().toLowerCase();
  const member = readLocalDb().members.find(
    (m) => m.member_code.toLowerCase() === q || m.phone.toLowerCase() === q
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

  const expectedCash = shift.opening_cash + byMethod.cash.total;
  const totalRevenue = txs.reduce((acc, t) => acc + t.total, 0);

  return {
    shift,
    transaction_count: txs.length,
    total_revenue: totalRevenue,
    by_method: byMethod,
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
  cashReceived?: number
): { total: number; cashReceivedVal: number | null; changeAmount: number | null } {
  const settings = getGymSettings();
  if (discount < 0) throw new Error("Diskon tidak boleh negatif.");
  if (discount > 0 && (!discountReason || !discountReason.trim())) {
    throw new Error("Alasan diskon wajib diisi jika memberikan diskon.");
  }
  if (actorRole === "cashier" && discount > settings.max_cashier_discount) {
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

  const discount = Math.round(input.discount ?? 0);
  const subtotal = pkg.price + pkg.registration_fee;
  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    input.discountReason,
    subtotal,
    input.paymentMethod,
    input.cashReceived
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
    discount_reason: discount > 0 ? input.discountReason?.trim() || null : null,
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

  const discount = Math.round(input.discount ?? 0);
  // Biaya pendaftaran hanya dikenakan pada pendaftaran pertama (Aturan Bisnis)
  const { total, cashReceivedVal, changeAmount } = validateDiscountAndCash(
    actor.role,
    discount,
    input.discountReason,
    pkg.price,
    input.paymentMethod,
    input.cashReceived
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
    discount_reason: discount > 0 ? input.discountReason?.trim() || null : null,
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
        member.status_info.status === "inactive"
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
