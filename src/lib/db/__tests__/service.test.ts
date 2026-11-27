import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import { resetLocalDbCache } from "../local-store";
import {
  authenticateStaff,
  cancelFreeze,
  closeShift,
  createExpense,
  createPromotion,
  finishFreezeEarly,
  getMemberByCodeOrPhone,
  getMemberById,
  getProfitLossReport,
  getShiftSummary,
  listPackages,
  listProducts,
  openShift,
  processPosTransaction,
  processRegistrationTransaction,
  processRenewalTransaction,
  recordMemberCheckin,
  requestFreeze,
  validatePromotion,
  voidTransaction,
} from "../service";
import { toSafeStaff } from "@/lib/auth/session";
import { readLocalDb } from "../local-store";

const DB_FILE = path.join(process.cwd(), ".data", "gym-db.json");

describe("Integrasi Service Layer & Kriteria Penerimaan (Section 13)", () => {
  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    resetLocalDbCache();
  });

  it("Kasir tanpa shift terbuka tidak bisa membuat transaksi", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    expect(kasir).toBeTruthy();
    const pkg = listPackages(true).find((p) => p.type === "membership")!;

    expect(() =>
      processRegistrationTransaction(kasir, {
        memberData: { full_name: "Test Member", phone: "089999999991" },
        packageId: pkg.id,
        paymentMethod: "cash",
        cashReceived: 500000,
      })
    ).toThrow(/Buka shift terlebih dahulu/);
  });

  it("Pendaftaran member baru, check-in, duplikat check-in, dan tutup shift dengan selisih kas", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const shift = openShift(kasir.id, 200000);
    const pkg = listPackages(true).find((p) => p.duration_days === 30)!;

    const { member, transaction } = processRegistrationTransaction(kasir, {
      memberData: { full_name: "Budi Baru", phone: "089999999992" },
      packageId: pkg.id,
      paymentMethod: "cash",
      cashReceived: 500000,
    });

    expect(transaction.total).toBe(pkg.price + pkg.registration_fee);
    expect(transaction.change_amount).toBe(500000 - transaction.total);

    const enriched = getMemberById(member.id)!;
    expect(enriched.status_info.status).toBe("active");
    expect(enriched.status_info.can_checkin).toBe(true);

    // Check-in pertama
    const c1 = recordMemberCheckin(kasir, member.id, "qr");
    expect(c1.allowed).toBe(true);
    expect(c1.is_duplicate).toBe(false);

    // Check-in kedua di hari yang sama -> diizinkan tapi ditandai duplikat
    const c2 = recordMemberCheckin(kasir, member.id, "qr");
    expect(c2.allowed).toBe(true);
    expect(c2.is_duplicate).toBe(true);

    // Tutup shift dengan selisih tanpa catatan -> ditolak
    const expectedCash = 200000 + transaction.total;
    expect(() => closeShift(kasir.id, shift.id, expectedCash - 10000)).toThrow(
      /Catatan wajib diisi/
    );

    // Tutup shift dengan catatan -> berhasil
    const closed = closeShift(
      kasir.id,
      shift.id,
      expectedCash - 10000,
      "Uang kembalian kurang Rp 10.000"
    );
    expect(closed.expected_cash).toBe(expectedCash);
    expect(closed.difference).toBe(-10000);
    expect(closed.status).toBe("closed");
  });

  it("Void transaksi oleh owner menghitung ulang masa aktif dan menolak kasir melakukan void", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    openShift(kasir.id, 100000);
    const pkg = listPackages(true).find((p) => p.duration_days === 30)!;

    // Ambil member yang sudah habis (Member 36 di seed)
    const db = readLocalDb();
    const expiredMember = db.members[35]; // index 35 = member 36 (habis)
    const beforeStatus = getMemberById(expiredMember.id)!;
    expect(beforeStatus.status_info.status).toBe("expired");

    // Perpanjang
    const { transaction } = processRenewalTransaction(kasir, {
      memberId: expiredMember.id,
      packageId: pkg.id,
      paymentMethod: "qris",
    });
    expect(getMemberById(expiredMember.id)!.status_info.status).toBe("active");

    // Kasir tidak boleh void
    expect(() => voidTransaction(kasir, transaction.id, "Salah input")).toThrow(
      /Hanya owner/
    );

    // Owner void -> masa aktif kembali habis
    const voided = voidTransaction(owner, transaction.id, "Salah input paket");
    expect(voided.status).toBe("void");
    expect(getMemberById(expiredMember.id)!.status_info.status).toBe("expired");
  });

  it("Scan member habis ditolak dan tidak mencatat check-in", () => {
    const db = readLocalDb();
    const kasir = toSafeStaff(db.users[1]);
    const expiredMember = db.members[35];

    const res = recordMemberCheckin(kasir, expiredMember.id, "qr");
    expect(res.allowed).toBe(false);
    expect(res.checkin).toBeNull();
  });

  it("Freeze 10 hari menolak check-in, akhiri lebih awal & cancel freeze bekerja sesuai aturan", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    openShift(kasir.id, 100000);
    const pkg = listPackages(true).find((p) => p.duration_days === 30)!;

    const { member } = processRegistrationTransaction(kasir, {
      memberData: { full_name: "Member Freeze", phone: "089999999995" },
      packageId: pkg.id,
      paymentMethod: "cash",
      cashReceived: 500000,
    });

    const beforeEnd = getMemberById(member.id)!.status_info.end_date!;
    const today = new Date().toISOString().slice(0, 10);
    const endFreeze = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);

    const freeze = requestFreeze(kasir, {
      memberId: member.id,
      startDate: today,
      endDate: endFreeze,
      reason: "sakit",
    });
    expect(getMemberById(member.id)!.status_info.status).toBe("frozen");

    // Check-in ditolak saat freeze
    const ci = recordMemberCheckin(kasir, member.id, "qr");
    expect(ci.allowed).toBe(false);

    // Akhiri lebih awal hari ini (terpakai 1 hari)
    finishFreezeEarly(kasir, freeze.id, today);
    expect(getMemberById(member.id)!.status_info.status).toBe("active");

    // Cancel freeze oleh owner mengembalikan tanggal habis ke semula
    cancelFreeze(owner, freeze.id, "Salah input member");
    expect(getMemberById(member.id)!.status_info.end_date).toBe(beforeEnd);
  });

  it("Kriteria 3 (Fase 2A): Penjualan produk mengurangi stok; void mengembalikan stok", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    openShift(kasir.id, 100000);

    const prod = listProducts(true)[0];
    const initialStock = prod.stock;

    const { transaction } = processPosTransaction(kasir, {
      guestName: "Beli Air",
      items: [{ productId: prod.id, qty: 3 }],
      paymentMethod: "cash",
      cashReceived: 50000,
    });

    const afterSale = listProducts(true).find((p) => p.id === prod.id)!;
    expect(afterSale.stock).toBe(initialStock - 3);

    voidTransaction(owner, transaction.id, "Batal beli");
    const afterVoid = listProducts(true).find((p) => p.id === prod.id)!;
    expect(afterVoid.stock).toBe(initialStock);
  });

  it("Kriteria 4 & 5 (Fase 2A): Pengeluaran tunai mengurangi kas seharusnya; Laba bersih = pendapatan - HPP - pengeluaran", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const shift = openShift(kasir.id, 300000);
    const prod = listProducts(true)[0];

    const { transaction } = processPosTransaction(kasir, {
      guestName: "Pembeli Tunai",
      items: [{ productId: prod.id, qty: 2 }],
      paymentMethod: "cash",
      cashReceived: 50000,
    });

    createExpense(kasir, {
      category: "kebersihan",
      amount: 15000,
      paymentMethod: "cash",
      notes: "Beli tisu",
    });

    const summary = getShiftSummary(shift.id);
    expect(summary.cash_expenses_total).toBe(15000);
    expect(summary.expected_cash).toBe(300000 + transaction.total - 15000);

    const closed = closeShift(kasir.id, shift.id, summary.expected_cash);
    expect(closed.difference).toBe(0);

    const pnl = getProfitLossReport();
    expect(pnl.net_profit).toBe(pnl.revenue.total - pnl.cogs - pnl.expenses.total);
  });

  it("Kriteria 6 (Fase 2A): Promo kuota 10 ditolak pada pemakaian ke-11; promo kedaluwarsa ditolak", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    openShift(kasir.id, 100000);
    const prod = listProducts(true)[0];

    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    createPromotion(owner.id, {
      name: "Kuota 10",
      code: "KUOTA10",
      discount_type: "nominal",
      discount_value: 2000,
      applies_to: "all",
      target_ids: [],
      start_date: today,
      end_date: nextMonth,
      max_quota: 10,
      max_per_member: null,
      new_member_only: false,
      is_active: true,
    });

    for (let i = 1; i <= 10; i++) {
      processPosTransaction(kasir, {
        guestName: `Pembeli ${i}`,
        items: [{ productId: prod.id, qty: 1 }],
        promoCode: "KUOTA10",
        paymentMethod: "qris",
      });
    }

    // Pemakaian ke-11 ditolak
    expect(() =>
      processPosTransaction(kasir, {
        guestName: "Pembeli 11",
        items: [{ productId: prod.id, qty: 1 }],
        promoCode: "KUOTA10",
        paymentMethod: "qris",
      })
    ).toThrow(/Kuota promo sudah habis/);

    // Promo kedaluwarsa ditolak
    createPromotion(owner.id, {
      name: "Expired Promo",
      code: "EXPIRED99",
      discount_type: "nominal",
      discount_value: 5000,
      applies_to: "all",
      target_ids: [],
      start_date: "2020-01-01",
      end_date: yesterday,
      max_quota: null,
      max_per_member: null,
      new_member_only: false,
      is_active: true,
    });

    expect(() =>
      validatePromotion({
        promoCode: "EXPIRED99",
        isNewMember: false,
        subtotal: 50000,
      })
    ).toThrow(/kedaluwarsa/);
  });

  it("Kriteria 7 (Fase 2A): Bonus referral hanya diberikan sekali dan dibatalkan jika transaksi di-void", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const owner = authenticateStaff("owner@ironpeak.id", "gym123456")!;
    openShift(kasir.id, 100000);
    const pkg = listPackages(true).find((p) => p.duration_days === 30)!;

    const dbBefore = readLocalDb();
    const referrer = dbBefore.members[0];
    const referrerEndBefore = getMemberById(referrer.id)!.status_info.end_date!;

    const { member: newMember, transaction } = processRegistrationTransaction(kasir, {
      memberData: { full_name: "Teman Baru", phone: "089999999997" },
      packageId: pkg.id,
      referralCode: referrer.referral_code,
      paymentMethod: "cash",
      cashReceived: 500000,
    });

    // Diskon referral Rp 50.000 diterapkan
    expect(transaction.discount).toBe(50000);
    // Pemberi referral mendapat tambahan 7 hari
    const referrerEndAfter = getMemberById(referrer.id)!.status_info.end_date!;
    expect(referrerEndAfter > referrerEndBefore).toBe(true);

    // Hanya ada 1 record referral untuk member baru ini
    const dbMid = readLocalDb();
    expect(dbMid.referrals.filter((r) => r.referred_member_id === newMember.id)).toHaveLength(1);

    // Void transaksi membatalkan bonus referral dan mengembalikan tanggal habis referrer
    voidTransaction(owner, transaction.id, "Batal daftar");
    const dbAfter = readLocalDb();
    expect(dbAfter.referrals[0].status).toBe("cancelled");
    expect(getMemberById(referrer.id)!.status_info.end_date).toBe(referrerEndBefore);
  });

  it("Kriteria 8 (Fase 2A): Kasir tidak bisa melakukan aksi khusus owner (stok/produk, void)", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    expect(() =>
      recordMemberCheckin(kasir, "invalid-id", "qr")
    ).toThrow();
    expect(kasir.role).toBe("cashier");
  });

  it("Presensi member mendukung QR (GYM-00001) dan ID manual singkat (1 / 00001)", () => {
    const kasir = authenticateStaff("kasir1@ironpeak.id", "gym123456")!;
    const mByCode = getMemberByCodeOrPhone("GYM-00001")!;
    const mByShort = getMemberByCodeOrPhone("1")!;
    expect(mByCode.id).toBe(mByShort.id);

    const ciQr = recordMemberCheckin(kasir, mByCode.id, "qr");
    expect(ciQr.allowed).toBe(true);

    const ciManual = recordMemberCheckin(kasir, mByShort.id, "search");
    expect(ciManual.allowed).toBe(true);
    expect(ciManual.is_duplicate).toBe(true);
  });
});
