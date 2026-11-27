import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";
import { resetLocalDbCache } from "../local-store";
import {
  authenticateStaff,
  closeShift,
  getMemberById,
  listPackages,
  openShift,
  processRegistrationTransaction,
  processRenewalTransaction,
  recordMemberCheckin,
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
});
