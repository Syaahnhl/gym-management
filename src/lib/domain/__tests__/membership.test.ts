import { describe, expect, it } from "vitest";
import {
  calculateRegistrationDates,
  calculateRenewalDates,
  computeMemberStatus,
} from "../membership";
import {
  buildWhatsAppUrl,
  formatInvoiceNumber,
  formatMemberCode,
  formatRupiah,
  normalizePhoneTo62,
  renderReminderMessage,
} from "../format";

describe("Logika Masa Aktif & Status Membership (Section 6.6 & 13)", () => {
  const today = "2026-11-27";

  it("FR-26: Pendaftaran baru paket bulanan (30 hari) dari hari ini", () => {
    const { startDate, endDate } = calculateRegistrationDates(30, undefined, today);
    expect(startDate).toBe("2026-11-27");
    expect(endDate).toBe("2026-12-26");
  });

  it("FR-26: Pendaftaran baru dengan tanggal mulai hingga 7 hari ke depan diperbolehkan", () => {
    const { startDate, endDate } = calculateRegistrationDates(30, "2026-12-04", today);
    expect(startDate).toBe("2026-12-04");
    expect(endDate).toBe("2027-01-02");
  });

  it("FR-26: Menolak tanggal mulai lebih dari 7 hari ke depan atau di masa lalu", () => {
    expect(() => calculateRegistrationDates(30, "2026-12-05", today)).toThrow();
    expect(() => calculateRegistrationDates(30, "2026-11-26", today)).toThrow();
  });

  it("Kriteria 2 (FR-27): Perpanjangan member yang masih punya sisa 5 hari menghasilkan tanggal habis = tanggal habis lama + durasi paket", () => {
    // Today 2026-11-27, old end_date = 2026-12-02 (sisa 5 hari)
    const activeMemberships = [
      { start_date: "2026-11-03", end_date: "2026-12-02", status: "active" as const },
    ];
    const { startDate, endDate } = calculateRenewalDates(30, activeMemberships, today);
    expect(startDate).toBe("2026-12-03"); // old end_date + 1
    expect(endDate).toBe("2027-01-01"); // 2026-12-02 + 30 hari
  });

  it("Kriteria 3 (FR-28): Perpanjangan member yang sudah habis dimulai dari hari ini", () => {
    const expiredMemberships = [
      { start_date: "2026-10-01", end_date: "2026-10-30", status: "active" as const },
    ];
    const { startDate, endDate } = calculateRenewalDates(30, expiredMemberships, today);
    expect(startDate).toBe("2026-11-27");
    expect(endDate).toBe("2026-12-26");
  });

  it("FR-29 & Kriteria 7: Void transaksi menghitung ulang masa aktif member", () => {
    const membershipsWithVoid = [
      { start_date: "2026-11-01", end_date: "2026-11-30", status: "active" as const },
      { start_date: "2026-12-01", end_date: "2026-12-30", status: "void" as const },
    ];
    const status = computeMemberStatus({ is_active: true }, membershipsWithVoid, 7, today);
    expect(status.end_date).toBe("2026-11-30");
    expect(status.status).toBe("expiring");
    expect(status.remaining_days).toBe(3);
    expect(status.can_checkin).toBe(true);
  });

  it("FR-30: Status Aktif (> reminderDays), Akan Habis (<= reminderDays), Habis (< 0), Belum Mulai, Nonaktif", () => {
    // Aktif (sisa 15 hari)
    const aktif = computeMemberStatus(
      { is_active: true },
      [{ start_date: "2026-11-13", end_date: "2026-12-12", status: "active" }],
      7,
      today
    );
    expect(aktif.status).toBe("active");
    expect(aktif.can_checkin).toBe(true);

    // Akan habis (sisa 5 hari)
    const expiring = computeMemberStatus(
      { is_active: true },
      [{ start_date: "2026-11-03", end_date: "2026-12-02", status: "active" }],
      7,
      today
    );
    expect(expiring.status).toBe("expiring");
    expect(expiring.can_checkin).toBe(true);

    // Habis (kemarin)
    const expired = computeMemberStatus(
      { is_active: true },
      [{ start_date: "2026-10-28", end_date: "2026-11-26", status: "active" }],
      7,
      today
    );
    expect(expired.status).toBe("expired");
    expect(expired.can_checkin).toBe(false);

    // Belum mulai
    const notStarted = computeMemberStatus(
      { is_active: true },
      [{ start_date: "2026-11-30", end_date: "2026-12-29", status: "active" }],
      7,
      today
    );
    expect(notStarted.status).toBe("not_started");
    expect(notStarted.can_checkin).toBe(false);

    // Nonaktif (soft delete owner)
    const inactive = computeMemberStatus(
      { is_active: false },
      [{ start_date: "2026-11-13", end_date: "2026-12-12", status: "active" }],
      7,
      today
    );
    expect(inactive.status).toBe("inactive");
    expect(inactive.can_checkin).toBe(false);
  });
});

describe("Format Rupiah, Kode, Invoice & WhatsApp", () => {
  it("Format Rupiah tanpa desimal", () => {
    expect(formatRupiah(150000)).toBe("Rp 150.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
  });

  it("Format kode member dan nomor invoice", () => {
    expect(formatMemberCode(1)).toBe("GYM-00001");
    expect(formatMemberCode(50)).toBe("GYM-00050");
    expect(formatInvoiceNumber("2026-11-27", 1)).toBe("INV-20261127-0001");
  });

  it("Normalisasi nomor HP ke 62xxx dan render pesan WhatsApp", () => {
    expect(normalizePhoneTo62("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhoneTo62("+62 812 3456 7890")).toBe("6281234567890");

    const msg = renderReminderMessage(
      "Halo {nama}, paket di {nama_gym} habis {tanggal_habis} ({sisa_hari} hari lagi).",
      {
        nama: "Budi Santoso",
        nama_gym: "IronPeak Gym",
        tanggal_habis: "02 Des 2026",
        sisa_hari: 5,
      }
    );
    expect(msg).toBe("Halo Budi Santoso, paket di IronPeak Gym habis 02 Des 2026 (5 hari lagi).");
    const url = buildWhatsAppUrl("081234567890", msg);
    expect(url).toContain("https://wa.me/6281234567890?text=");
  });
});
