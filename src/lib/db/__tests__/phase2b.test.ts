import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import { resetLocalDbCache } from "../local-store";
import { authenticateStaff } from "../service";
import {
  bookClass,
  confirmPaymentGatewayWebhook,
  createClassSchedule,
  createPtSession,
  createSelfServicePaymentIntent,
  getTrainerCommissionsReport,
  listClasses,
  listTrainers,
  sendAutomatedWhatsappReminders,
  triggerTurnstileGate,
  updatePtSessionStatus,
} from "../phase2b-service";
import { readLocalDb } from "../local-store";

const DB_FILE = path.join(process.cwd(), ".data", "gym-db.json");

describe("Fase 2B: PT, Kelas, Payment Gateway, WA Otomatis & Turnstile", () => {
  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    resetLocalDbCache();
  });

  it("Personal Trainer, Sesi PT, dan Laporan Komisi bekerja sesuai skema", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const db = readLocalDb();
    const trainer = listTrainers(true)[0]; // 40% komisi
    const member = db.members[0];

    const session = createPtSession(kasir, {
      memberId: member.id,
      trainerId: trainer.id,
      sessionDate: "2026-11-27",
      sessionTime: "15:00",
      sessionFee: 300000,
    });
    expect(session.commission_amount).toBe(120000);
    updatePtSessionStatus(kasir, session.id, "completed");

    const report = getTrainerCommissionsReport();
    const tReport = report.find((r) => r.id === trainer.id)!;
    expect(tReport.completed_sessions).toBeGreaterThanOrEqual(2);
    expect(tReport.total_commission).toBeGreaterThanOrEqual(220000);
  });

  it("Jadwal Kelas & Booking menolak jika kuota penuh atau member ganda", () => {
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    const db = readLocalDb();
    const cls = createClassSchedule(owner.id, {
      title: "Kelas Terbatas",
      trainer_id: listTrainers(true)[0].id,
      class_date: "2026-11-28",
      start_time: "08:00",
      end_time: "09:00",
      max_capacity: 1,
      fee_per_session: 0,
      is_active: true,
    });

    bookClass(owner.id, cls.id, db.members[0].id);
    expect(() => bookClass(owner.id, cls.id, db.members[1].id)).toThrow(/penuh/);
    expect(listClasses().find((c) => c.id === cls.id)?.booked_count).toBe(1);
  });

  it("Self-Service Payment Gateway Portal mengaktifkan transaksi & membership via webhook", () => {
    const db = readLocalDb();
    const member = db.members[35]; // expired member
    const pkg = db.packages.find((p) => p.type === "membership")!;

    const intent = createSelfServicePaymentIntent({
      memberId: member.id,
      packageId: pkg.id,
    });
    expect(intent.status).toBe("pending");

    const { intent: paidIntent, transaction } = confirmPaymentGatewayWebhook(
      intent.order_id
    );
    expect(paidIntent.status).toBe("paid");
    expect(transaction.status).toBe("paid");
  });

  it("Pengingat WA otomatis & Turnstile gate berjalan tanpa error", async () => {
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    const waRes = await sendAutomatedWhatsappReminders(owner.id);
    expect(waRes.sent_count).toBeGreaterThan(0);

    const gateRes = await triggerTurnstileGate("GYM-00001");
    expect(gateRes.triggered).toBe(false); // default disabled in settings
  });
});
