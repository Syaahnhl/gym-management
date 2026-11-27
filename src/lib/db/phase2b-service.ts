import crypto from "crypto";
import { readLocalDb, writeLocalDb } from "./local-store";
import { addActivityLog, listMembersWithStatus } from "./service";
import {
  calculateRenewalDates,
  getJakartaTodayStr,
} from "@/lib/domain/membership";
import {
  formatDateId,
  formatInvoiceNumber,
  normalizePhoneTo62,
  renderReminderMessage,
} from "@/lib/domain/format";
import type {
  Branch,
  ClassBooking,
  ClassSchedule,
  PaymentIntent,
  PtSession,
  SafeStaffUser,
  Trainer,
  Transaction,
  WhatsappLog,
} from "@/types/database";

// ============================================================================
// 1. Personal Trainer, Sesi PT, Jadwal Kelas & Komisi
// ============================================================================
export function listTrainers(activeOnly = false): Trainer[] {
  const rows = readLocalDb().trainers || [];
  return activeOnly ? rows.filter((t) => t.is_active) : rows;
}

export function createTrainer(
  actorId: string,
  input: Omit<Trainer, "id" | "created_at">
): Trainer {
  const db = readLocalDb();
  db.trainers = db.trainers || [];
  const trainer: Trainer = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.trainers.push(trainer);
  writeLocalDb(db);
  addActivityLog(actorId, "create_trainer", "trainer", trainer.id, {
    name: trainer.name,
  });
  return trainer;
}

export function updateTrainer(
  actorId: string,
  id: string,
  patch: Partial<Omit<Trainer, "id" | "created_at">>
): Trainer {
  const db = readLocalDb();
  const idx = (db.trainers || []).findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Trainer tidak ditemukan.");
  db.trainers[idx] = { ...db.trainers[idx], ...patch };
  writeLocalDb(db);
  addActivityLog(actorId, "update_trainer", "trainer", id, patch);
  return db.trainers[idx];
}

export function listPtPackages() {
  return readLocalDb().pt_packages || [];
}

export function listPtSessions() {
  const db = readLocalDb();
  const memberMap = new Map(db.members.map((m) => [m.id, m.full_name]));
  const trainerMap = new Map((db.trainers || []).map((t) => [t.id, t.name]));
  return [...(db.pt_sessions || [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((s) => ({
      ...s,
      member_name: memberMap.get(s.member_id) || "-",
      trainer_name: trainerMap.get(s.trainer_id) || "-",
    }));
}

export function createPtSession(
  actor: SafeStaffUser,
  input: {
    memberId: string;
    trainerId: string;
    sessionDate: string;
    sessionTime: string;
    sessionFee: number;
    notes?: string;
  }
): PtSession {
  const db = readLocalDb();
  const trainer = (db.trainers || []).find(
    (t) => t.id === input.trainerId && t.is_active
  );
  if (!trainer) throw new Error("Trainer tidak ditemukan atau tidak aktif.");

  const commissionAmount =
    trainer.commission_type === "percent"
      ? Math.round((input.sessionFee * trainer.commission_value) / 100)
      : trainer.commission_value;

  const session: PtSession = {
    id: crypto.randomUUID(),
    member_id: input.memberId,
    trainer_id: input.trainerId,
    pt_package_id: null,
    session_date: input.sessionDate,
    session_time: input.sessionTime,
    session_fee: Math.round(input.sessionFee),
    commission_amount: commissionAmount,
    status: "scheduled",
    notes: input.notes?.trim() || null,
    created_by: actor.id,
    created_at: new Date().toISOString(),
  };

  db.pt_sessions = db.pt_sessions || [];
  db.pt_sessions.push(session);
  writeLocalDb(db);
  addActivityLog(actor.id, "create_pt_session", "pt_session", session.id, {
    trainer_id: trainer.id,
    commission_amount: commissionAmount,
  });
  return session;
}

export function updatePtSessionStatus(
  actor: SafeStaffUser,
  sessionId: string,
  status: "completed" | "cancelled"
): PtSession {
  const db = readLocalDb();
  const idx = (db.pt_sessions || []).findIndex((s) => s.id === sessionId);
  if (idx === -1) throw new Error("Sesi PT tidak ditemukan.");
  db.pt_sessions[idx].status = status;
  writeLocalDb(db);
  addActivityLog(actor.id, "update_pt_session", "pt_session", sessionId, {
    status,
  });
  return db.pt_sessions[idx];
}

export function getTrainerCommissionsReport() {
  const db = readLocalDb();
  const sessions = (db.pt_sessions || []).filter(
    (s) => s.status === "completed"
  );
  return (db.trainers || []).map((t) => {
    const mine = sessions.filter((s) => s.trainer_id === t.id);
    return {
      ...t,
      completed_sessions: mine.length,
      total_fee: mine.reduce((s, x) => s + x.session_fee, 0),
      total_commission: mine.reduce((s, x) => s + x.commission_amount, 0),
    };
  });
}

export function listClasses() {
  const db = readLocalDb();
  const trainerMap = new Map((db.trainers || []).map((t) => [t.id, t.name]));
  const bookings = db.class_bookings || [];
  return [...(db.class_schedules || [])]
    .sort((a, b) => a.class_date.localeCompare(b.class_date))
    .map((c) => {
      const activeBookings = bookings.filter(
        (b) => b.class_schedule_id === c.id && b.status !== "cancelled"
      );
      return {
        ...c,
        trainer_name: c.trainer_id ? trainerMap.get(c.trainer_id) || "-" : "-",
        booked_count: activeBookings.length,
      };
    });
}

export function createClassSchedule(
  actorId: string,
  input: Omit<ClassSchedule, "id" | "created_at">
): ClassSchedule {
  const db = readLocalDb();
  db.class_schedules = db.class_schedules || [];
  const cls: ClassSchedule = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.class_schedules.push(cls);
  writeLocalDb(db);
  addActivityLog(actorId, "create_class", "class_schedule", cls.id, {
    title: cls.title,
  });
  return cls;
}

export function bookClass(
  actorId: string,
  classId: string,
  memberId: string
): ClassBooking {
  const db = readLocalDb();
  const cls = (db.class_schedules || []).find(
    (c) => c.id === classId && c.is_active
  );
  if (!cls) throw new Error("Jadwal kelas tidak ditemukan atau tidak aktif.");

  db.class_bookings = db.class_bookings || [];
  const existing = db.class_bookings.find(
    (b) =>
      b.class_schedule_id === classId &&
      b.member_id === memberId &&
      b.status !== "cancelled"
  );
  if (existing) throw new Error("Member sudah terdaftar di kelas ini.");

  const currentCount = db.class_bookings.filter(
    (b) => b.class_schedule_id === classId && b.status !== "cancelled"
  ).length;
  if (currentCount >= cls.max_capacity) {
    throw new Error("Kuota kelas sudah penuh.");
  }

  const booking: ClassBooking = {
    id: crypto.randomUUID(),
    class_schedule_id: classId,
    member_id: memberId,
    status: "booked",
    created_at: new Date().toISOString(),
  };
  db.class_bookings.push(booking);
  writeLocalDb(db);
  addActivityLog(actorId, "book_class", "class_booking", booking.id, {
    class_id: classId,
    member_id: memberId,
  });
  return booking;
}

// ============================================================================
// 2. Payment Gateway (Midtrans / Xendit) & Self-Service Portal Renewal
// ============================================================================
export function createSelfServicePaymentIntent(input: {
  memberId: string;
  packageId: string;
}): PaymentIntent {
  const db = readLocalDb();
  const member = db.members.find((m) => m.id === input.memberId && m.is_active);
  if (!member) throw new Error("Member tidak ditemukan atau nonaktif.");
  const pkg = db.packages.find(
    (p) => p.id === input.packageId && p.is_active && p.type === "membership"
  );
  if (!pkg) throw new Error("Paket membership tidak valid.");

  const provider = db.gym_settings.payment_gateway_provider || "midtrans";
  const orderId = `PG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const intent: PaymentIntent = {
    id: crypto.randomUUID(),
    order_id: orderId,
    member_id: member.id,
    package_id: pkg.id,
    amount: pkg.price,
    provider,
    payment_url: `https://pay.demo.local/checkout/${orderId}`,
    qr_string: `QRIS|${orderId}|${pkg.price}`,
    status: "pending",
    paid_at: null,
    transaction_id: null,
    created_at: new Date().toISOString(),
  };

  db.payment_intents = db.payment_intents || [];
  db.payment_intents.push(intent);
  writeLocalDb(db);
  return intent;
}

export function confirmPaymentGatewayWebhook(orderId: string): {
  intent: PaymentIntent;
  transaction: Transaction;
} {
  const db = readLocalDb();
  const idx = (db.payment_intents || []).findIndex(
    (p) => p.order_id === orderId
  );
  if (idx === -1) throw new Error("Order pembayaran tidak ditemukan.");
  const intent = db.payment_intents[idx];
  if (intent.status === "paid" && intent.transaction_id) {
    const existingTx = db.transactions.find(
      (t) => t.id === intent.transaction_id
    )!;
    return { intent, transaction: existingTx };
  }

  const pkg = db.packages.find((p) => p.id === intent.package_id)!;
  const existingMs = db.memberships.filter(
    (m) => m.member_id === intent.member_id
  );
  const { startDate, endDate } = calculateRenewalDates(
    pkg.duration_days,
    existingMs
  );

  // Gunakan shift terakhir atau buat sistem shift online
  let onlineShiftId = db.shifts[0]?.id;
  if (!onlineShiftId) {
    onlineShiftId = crypto.randomUUID();
    db.shifts.push({
      id: onlineShiftId,
      cashier_id: db.users[0].id,
      opened_at: new Date().toISOString(),
      opening_cash: 0,
      closed_at: null,
      expected_cash: 0,
      actual_cash: null,
      difference: null,
      notes: "Online Payment Gateway",
      status: "closed",
    });
  }

  const nowIso = new Date().toISOString();
  const todayCompact = getJakartaTodayStr().replaceAll("-", "");
  const seq =
    db.transactions.filter((t) =>
      t.invoice_number.startsWith(`INV-${todayCompact}-`)
    ).length + 1;

  const tx: Transaction = {
    id: crypto.randomUUID(),
    invoice_number: formatInvoiceNumber(getJakartaTodayStr(), seq),
    type: "renewal",
    member_id: intent.member_id,
    guest_name: null,
    guest_phone: null,
    package_id: pkg.id,
    package_price: pkg.price,
    registration_fee: 0,
    discount: 0,
    discount_reason: null,
    promotion_id: null,
    total: intent.amount,
    payment_method: "qris",
    cash_received: null,
    change_amount: null,
    cashier_id: db.users[0].id,
    shift_id: onlineShiftId,
    status: "paid",
    void_reason: null,
    voided_by: null,
    voided_at: null,
    notes: `Online Payment (${intent.provider.toUpperCase()}): ${orderId}`,
    created_at: nowIso,
  };

  db.transactions.push(tx);
  db.memberships.push({
    id: crypto.randomUUID(),
    member_id: intent.member_id,
    package_id: pkg.id,
    transaction_id: tx.id,
    start_date: startDate,
    end_date: endDate,
    status: "active",
    created_at: nowIso,
  });

  db.payment_intents[idx] = {
    ...intent,
    status: "paid",
    paid_at: nowIso,
    transaction_id: tx.id,
  };

  writeLocalDb(db);
  addActivityLog(null, "payment_gateway_paid", "payment_intent", intent.id, {
    order_id: orderId,
    amount: intent.amount,
  });

  return { intent: db.payment_intents[idx], transaction: tx };
}

// ============================================================================
// 3. WhatsApp API Otomatis & Log
// ============================================================================
export function listWhatsappLogs(): WhatsappLog[] {
  return [...(readLocalDb().whatsapp_logs || [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function sendAutomatedWhatsappReminders(
  actorId: string
): Promise<{ sent_count: number; logs: WhatsappLog[] }> {
  const db = readLocalDb();
  const settings = db.gym_settings;
  const members = listMembersWithStatus().filter(
    (m) => m.is_active && m.status_info.status === "expiring"
  );

  const createdLogs: WhatsappLog[] = [];
  db.whatsapp_logs = db.whatsapp_logs || [];
  const todayStr = getJakartaTodayStr();

  for (const m of members) {
    // Hindari kirim berulang di hari yang sama
    if (
      m.last_reminded_at &&
      getJakartaTodayStr(new Date(m.last_reminded_at)) === todayStr
    ) {
      continue;
    }

    const msg = renderReminderMessage(settings.reminder_template, {
      nama: m.full_name,
      tanggal_habis: formatDateId(m.status_info.end_date),
      sisa_hari: Math.max(0, m.status_info.remaining_days ?? 0),
      nama_gym: settings.name,
    });

    const provider = settings.wa_api_provider || "fonnte";
    let status: "sent" | "failed" = "sent";

    // Jika token asli diisi & provider fonnte, kirim ke API eksternal
    if (settings.auto_wa_enabled && settings.wa_api_token && provider === "fonnte") {
      try {
        const res = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: settings.wa_api_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: normalizePhoneTo62(m.phone),
            message: msg,
          }),
        });
        if (!res.ok) status = "failed";
      } catch {
        status = "failed";
      }
    }

    const log: WhatsappLog = {
      id: crypto.randomUUID(),
      member_id: m.id,
      phone: normalizePhoneTo62(m.phone),
      message: msg,
      type: "reminder",
      status,
      provider,
      created_at: new Date().toISOString(),
    };
    db.whatsapp_logs.unshift(log);
    createdLogs.push(log);

    const mIdx = db.members.findIndex((x) => x.id === m.id);
    if (mIdx !== -1) {
      db.members[mIdx].last_reminded_at = new Date().toISOString();
      db.members[mIdx].last_reminded_by = actorId;
    }
  }

  writeLocalDb(db);
  addActivityLog(actorId, "auto_wa_reminders", "whatsapp", null, {
    sent_count: createdLogs.length,
  });

  return { sent_count: createdLogs.length, logs: createdLogs };
}

// ============================================================================
// 4. Multi-Cabang & Turnstile Pintu Otomatis
// ============================================================================
export function listBranches(): Branch[] {
  return readLocalDb().branches || [];
}

export function createBranch(
  actorId: string,
  input: { name: string; address: string; phone: string }
): Branch {
  const db = readLocalDb();
  db.branches = db.branches || [];
  const branch: Branch = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    is_active: true,
    created_at: new Date().toISOString(),
  };
  db.branches.push(branch);
  writeLocalDb(db);
  addActivityLog(actorId, "create_branch", "branch", branch.id, {
    name: branch.name,
  });
  return branch;
}

export async function triggerTurnstileGate(memberCode: string): Promise<{
  triggered: boolean;
  message: string;
}> {
  const settings = readLocalDb().gym_settings;
  if (!settings.turnstile_enabled) {
    return { triggered: false, message: "Turnstile otomatis nonaktif." };
  }
  if (!settings.turnstile_webhook_url) {
    return {
      triggered: true,
      message: `Simulasi pintu terbuka untuk ${memberCode} (URL webhook belum diisi).`,
    };
  }
  try {
    const res = await fetch(settings.turnstile_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open_gate",
        member_code: memberCode,
        timestamp: new Date().toISOString(),
      }),
    });
    return {
      triggered: res.ok,
      message: res.ok
        ? `Sinyal buka pintu terkirim untuk ${memberCode}.`
        : "Gagal menghubungi controller turnstile.",
    };
  } catch {
    return {
      triggered: false,
      message: "Tidak dapat terhubung ke controller turnstile.",
    };
  }
}
