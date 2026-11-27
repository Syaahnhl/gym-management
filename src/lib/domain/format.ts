import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { GYM_TIMEZONE } from "./membership";

/**
 * Format angka ke Rupiah tanpa desimal, contoh: Rp 150.000
 */
export function formatRupiah(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.round(Math.abs(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNeg ? "-" : ""}Rp ${formatted}`;
}

/**
 * Format tanggal YYYY-MM-DD ke tampilan Indonesia, contoh: 27 Nov 2026
 */
export function formatDateId(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = dateStr.length === 10 ? parseISO(dateStr) : toZonedTime(parseISO(dateStr), GYM_TIMEZONE);
    return format(d, "dd MMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp ISO ke tanggal & jam WIB, contoh: 27 Nov 2026, 14:30 WIB
 */
export function formatDateTimeWib(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  try {
    const zoned = toZonedTime(parseISO(isoStr), GYM_TIMEZONE);
    return `${format(zoned, "dd MMM yyyy, HH:mm", { locale: idLocale })} WIB`;
  } catch {
    return isoStr;
  }
}

/**
 * Ubah nomor HP Indonesia (08xx, +628xx, 628xx) ke format internasional 62xxx untuk WhatsApp.
 */
export function normalizePhoneTo62(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

/**
 * Render template pesan WhatsApp dengan variabel {nama}, {tanggal_habis}, {sisa_hari}, {nama_gym}.
 */
export function renderReminderMessage(
  template: string,
  vars: {
    nama: string;
    tanggal_habis: string;
    sisa_hari: number | string;
    nama_gym: string;
  }
): string {
  return template
    .replaceAll("{nama}", vars.nama)
    .replaceAll("{tanggal_habis}", vars.tanggal_habis)
    .replaceAll("{sisa_hari}", String(vars.sisa_hari))
    .replaceAll("{nama_gym}", vars.nama_gym);
}

/**
 * Membuat link wa.me dengan pesan terisi otomatis.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhoneTo62(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate kode member berikutnya: GYM-00001
 */
export function formatMemberCode(seq: number): string {
  return `GYM-${String(seq).padStart(5, "0")}`;
}

/**
 * Generate nomor invoice: INV-YYYYMMDD-0001
 */
export function formatInvoiceNumber(dateStrYyyyMmDd: string, seq: number): string {
  const compact = dateStrYyyyMmDd.replaceAll("-", "");
  return `INV-${compact}-${String(seq).padStart(4, "0")}`;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer Bank",
  card: "Kartu Debit/Kredit (EDC)",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  registration: "Pendaftaran Member",
  renewal: "Perpanjangan",
  daily: "Tiket Harian",
  pos: "Penjualan Produk",
  mixed: "Paket & Produk",
};

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  minuman: "Minuman",
  suplemen: "Suplemen",
  merchandise: "Merchandise",
  sewa: "Sewa Handuk/Loker",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  gaji: "Gaji Staff",
  listrik: "Listrik",
  air: "Air",
  sewa: "Sewa Tempat",
  perawatan: "Perawatan Alat",
  kebersihan: "Kebersihan",
  marketing: "Marketing",
  lainnya: "Lainnya",
};
