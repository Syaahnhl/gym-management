import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type {
  ComputedMemberStatus,
  Freeze,
  Member,
  MemberStatusInfo,
  Membership,
} from "@/types/database";

export const GYM_TIMEZONE = "Asia/Jakarta";

/**
 * Mengembalikan tanggal hari ini dalam zona waktu Asia/Jakarta dalam format YYYY-MM-DD.
 */
export function getJakartaTodayStr(now: Date = new Date()): string {
  const zoned = toZonedTime(now, GYM_TIMEZONE);
  return format(zoned, "yyyy-MM-dd");
}

/**
 * Mengembalikan Date (tanpa jam) dari string YYYY-MM-DD.
 */
export function parseDateOnly(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Menambahkan sejumlah hari ke tanggal YYYY-MM-DD dan mengembalikan YYYY-MM-DD.
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  return format(addDays(parseDateOnly(dateStr), days), "yyyy-MM-dd");
}

/**
 * Menghitung tanggal mulai & selesai untuk pendaftaran member baru (FR-26).
 * start_date = hari ini (atau tanggal yang dipilih kasir, maks 7 hari ke depan)
 * end_date = start_date + duration_days - 1
 */
export function calculateRegistrationDates(
  durationDays: number,
  requestedStartDate?: string,
  todayStr: string = getJakartaTodayStr()
): { startDate: string; endDate: string } {
  if (durationDays < 1) {
    throw new Error("Durasi paket minimal 1 hari");
  }

  let startDate = todayStr;
  if (requestedStartDate) {
    const diff = differenceInCalendarDays(
      parseDateOnly(requestedStartDate),
      parseDateOnly(todayStr)
    );
    if (diff < 0) {
      throw new Error("Tanggal mulai tidak boleh di masa lalu");
    }
    if (diff > 7) {
      throw new Error("Tanggal mulai maksimal 7 hari ke depan");
    }
    startDate = requestedStartDate;
  }

  const endDate = addDaysToDateStr(startDate, durationDays - 1);
  return { startDate, endDate };
}

/**
 * Menghitung tanggal mulai & selesai untuk perpanjangan membership (FR-27, FR-28).
 * - Jika masih aktif (end_date >= today): start_date = old_end_date + 1 hari,
 *   sehingga end_date = old_end_date + duration_days (sisa hari tidak hilang).
 * - Jika sudah habis (end_date < today atau belum ada membership aktif):
 *   start_date = hari ini, end_date = hari ini + duration_days - 1.
 */
export function calculateRenewalDates(
  durationDays: number,
  activeMemberships: Pick<Membership, "start_date" | "end_date" | "status">[],
  todayStr: string = getJakartaTodayStr()
): { startDate: string; endDate: string } {
  if (durationDays < 1) {
    throw new Error("Durasi paket minimal 1 hari");
  }

  const valid = activeMemberships.filter((m) => m.status === "active");
  let maxEndDate: string | null = null;
  for (const m of valid) {
    if (!maxEndDate || m.end_date > maxEndDate) {
      maxEndDate = m.end_date;
    }
  }

  if (maxEndDate && maxEndDate >= todayStr) {
    const startDate = addDaysToDateStr(maxEndDate, 1);
    const endDate = addDaysToDateStr(startDate, durationDays - 1);
    return { startDate, endDate };
  }

  const startDate = todayStr;
  const endDate = addDaysToDateStr(startDate, durationDays - 1);
  return { startDate, endDate };
}

export const STATUS_LABELS: Record<ComputedMemberStatus, string> = {
  active: "Aktif",
  expiring: "Akan Habis",
  expired: "Habis",
  not_started: "Belum Mulai",
  frozen: "Freeze",
  inactive: "Nonaktif",
};

/**
 * Menghitung jumlah hari freeze inklusif (start_date s/d end_date).
 */
export function calculateFreezeDays(startDate: string, endDate: string): number {
  const diff = differenceInCalendarDays(
    parseDateOnly(endDate),
    parseDateOnly(startDate)
  );
  return diff >= 0 ? diff + 1 : 0;
}

/**
 * Menghitung hari freeze yang efektif menambah masa aktif membership.
 */
export function computeEffectiveFreezeDays(
  freeze: Pick<Freeze, "start_date" | "end_date" | "actual_end_date" | "status">
): number {
  if (freeze.status === "cancelled") return 0;
  if (freeze.status === "finished" && freeze.actual_end_date) {
    return calculateFreezeDays(freeze.start_date, freeze.actual_end_date);
  }
  return calculateFreezeDays(freeze.start_date, freeze.end_date);
}

/**
 * Menghitung status member secara dinamis dari daftar memberships & freezes (FR-29, FR-30, Fase 2A).
 */
export function computeMemberStatus(
  member: Pick<Member, "is_active">,
  memberships: Pick<Membership, "start_date" | "end_date" | "status">[],
  reminderDays: number = 7,
  todayStr: string = getJakartaTodayStr(),
  freezes: Pick<Freeze, "start_date" | "end_date" | "actual_end_date" | "status">[] = []
): MemberStatusInfo {
  if (!member.is_active) {
    return {
      status: "inactive",
      label: STATUS_LABELS.inactive,
      start_date: null,
      end_date: null,
      remaining_days: null,
      can_checkin: false,
    };
  }

  const valid = memberships.filter((m) => m.status === "active");
  if (valid.length === 0) {
    return {
      status: "expired",
      label: STATUS_LABELS.expired,
      start_date: null,
      end_date: null,
      remaining_days: null,
      can_checkin: false,
    };
  }

  let maxEndDate = valid[0].end_date;
  let minStartDate = valid[0].start_date;
  for (const m of valid) {
    if (m.end_date > maxEndDate) maxEndDate = m.end_date;
    if (m.start_date < minStartDate) minStartDate = m.start_date;
  }

  // Tambahkan total hari freeze efektif ke tanggal habis membership
  const totalFreezeDays = freezes.reduce(
    (sum, f) => sum + computeEffectiveFreezeDays(f),
    0
  );
  const effectiveEndDate =
    totalFreezeDays > 0
      ? addDaysToDateStr(maxEndDate, totalFreezeDays)
      : maxEndDate;

  const today = parseDateOnly(todayStr);
  const start = parseDateOnly(minStartDate);
  const end = parseDateOnly(effectiveEndDate);

  // Cek apakah member sedang dalam periode freeze aktif hari ini
  const activeFreeze = freezes.find(
    (f) =>
      f.status === "active" &&
      f.start_date <= todayStr &&
      f.end_date >= todayStr
  );
  if (activeFreeze) {
    const remainingDays = differenceInCalendarDays(end, today);
    return {
      status: "frozen",
      label: STATUS_LABELS.frozen,
      start_date: minStartDate,
      end_date: effectiveEndDate,
      remaining_days: remainingDays,
      can_checkin: false,
    };
  }

  // Jika semua membership aktif dimulai di masa depan
  if (start > today) {
    const remainingDays = differenceInCalendarDays(end, today);
    return {
      status: "not_started",
      label: STATUS_LABELS.not_started,
      start_date: minStartDate,
      end_date: effectiveEndDate,
      remaining_days: remainingDays,
      can_checkin: false,
    };
  }

  const remainingDays = differenceInCalendarDays(end, today);

  if (remainingDays < 0) {
    return {
      status: "expired",
      label: STATUS_LABELS.expired,
      start_date: minStartDate,
      end_date: effectiveEndDate,
      remaining_days: remainingDays,
      can_checkin: false,
    };
  }

  if (remainingDays <= reminderDays) {
    return {
      status: "expiring",
      label: STATUS_LABELS.expiring,
      start_date: minStartDate,
      end_date: effectiveEndDate,
      remaining_days: remainingDays,
      can_checkin: true,
    };
  }

  return {
    status: "active",
    label: STATUS_LABELS.active,
    start_date: minStartDate,
    end_date: effectiveEndDate,
    remaining_days: remainingDays,
    can_checkin: true,
  };
}
