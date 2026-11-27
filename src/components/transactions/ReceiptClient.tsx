"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Printer, XOctagon } from "lucide-react";
import type {
  GymSettings,
  Member,
  Membership,
  Package,
  StaffRole,
  Transaction,
} from "@/types/database";
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
  buildWhatsAppUrl,
  formatDateId,
  formatDateTimeWib,
  formatRupiah,
} from "@/lib/domain/format";

export function ReceiptClient({
  transaction,
  member,
  pkg,
  membership,
  cashierName,
  settings,
  staffRole,
}: {
  transaction: Transaction;
  member: Member | null;
  pkg: Package | null;
  membership: Membership | null;
  cashierName: string;
  settings: GymSettings;
  staffRole: StaffRole;
}) {
  const router = useRouter();
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">("80mm");
  const [voidModal, setVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const targetPhone = member?.phone || transaction.guest_phone || "";
  const targetName = member?.full_name || transaction.guest_name || "Pelanggan";
  const portalUrl =
    member && typeof window !== "undefined"
      ? `${window.location.origin}/m/${member.portal_token}`
      : "";

  const waReceiptText = `Struk Pembayaran ${settings.name}\nNo: ${transaction.invoice_number}\nNama: ${targetName}\nPaket: ${pkg?.name || "-"}\nTotal: ${formatRupiah(transaction.total)} (${PAYMENT_METHOD_LABELS[transaction.payment_method]})${
    membership
      ? `\nMasa Aktif: ${formatDateId(membership.start_date)} s/d ${formatDateId(membership.end_date)}`
      : ""
  }${portalUrl ? `\nPortal QR Member: ${portalUrl}` : ""}`;

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/transactions/${transaction.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: voidReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal membatalkan transaksi");
      return;
    }
    setVoidModal(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Struk & Detail Transaksi
          </h1>
          <p className="font-mono text-sm text-slate-500">
            {transaction.invoice_number}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as "58mm" | "80mm")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="58mm">Thermal 58mm</option>
            <option value="80mm">Thermal 80mm</option>
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
          {targetPhone && (
            <a
              href={buildWhatsAppUrl(targetPhone, waReceiptText)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Kirim ke WhatsApp
            </a>
          )}
          {staffRole === "owner" && transaction.status === "paid" && (
            <button
              type="button"
              onClick={() => setVoidModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <XOctagon className="h-4 w-4" />
              Void Transaksi
            </button>
          )}
        </div>
      </div>

      {/* Thermal Receipt Preview */}
      <div
        className={`mx-auto rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-900 shadow-sm ${
          paperSize === "58mm" ? "max-w-[260px]" : "max-w-[340px]"
        }`}
      >
        <div className="border-b border-dashed border-slate-300 pb-3 text-center">
          <p className="text-sm font-bold">{settings.name}</p>
          {settings.address && (
            <p className="text-[11px] text-slate-600">{settings.address}</p>
          )}
          <p className="mt-1 text-[11px]">{transaction.invoice_number}</p>
          <p className="text-[11px] text-slate-500">
            {formatDateTimeWib(transaction.created_at)}
          </p>
        </div>

        {transaction.status === "void" && (
          <div className="my-2 rounded bg-rose-100 p-2 text-center font-bold text-rose-800">
            TRANSAKSI VOID
            <div className="font-normal">Alasan: {transaction.void_reason}</div>
          </div>
        )}

        <div className="space-y-1 border-b border-dashed border-slate-300 py-3">
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span className="font-bold">{targetName}</span>
          </div>
          {member && (
            <div className="flex justify-between">
              <span>Kode Member:</span>
              <span>{member.member_code}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Jenis:</span>
            <span>{TRANSACTION_TYPE_LABELS[transaction.type]}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{cashierName}</span>
          </div>
        </div>

        <div className="space-y-1 border-b border-dashed border-slate-300 py-3">
          <div className="flex justify-between">
            <span>{pkg?.name || "Paket"}</span>
            <span>{formatRupiah(transaction.package_price)}</span>
          </div>
          {transaction.registration_fee > 0 && (
            <div className="flex justify-between">
              <span>Biaya Daftar</span>
              <span>{formatRupiah(transaction.registration_fee)}</span>
            </div>
          )}
          {transaction.discount > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>Diskon</span>
              <span>-{formatRupiah(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatRupiah(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Metode</span>
            <span>{PAYMENT_METHOD_LABELS[transaction.payment_method]}</span>
          </div>
          {transaction.cash_received !== null && (
            <>
              <div className="flex justify-between text-[11px]">
                <span>Tunai</span>
                <span>{formatRupiah(transaction.cash_received)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Kembalian</span>
                <span>{formatRupiah(transaction.change_amount ?? 0)}</span>
              </div>
            </>
          )}
        </div>

        {membership && (
          <div className="border-b border-dashed border-slate-300 py-2 text-center text-[11px]">
            Masa Aktif: {formatDateId(membership.start_date)} s/d{" "}
            {formatDateId(membership.end_date)}
          </div>
        )}

        <p className="pt-3 text-center text-[11px] text-slate-500">
          Terima kasih telah berlatih bersama kami!
        </p>
      </div>

      {voidModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Batalkan (Void) Transaksi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Transaksi tidak akan dihapus, namun dikeluarkan dari laporan
              pendapatan dan masa aktif member akan dihitung ulang.
            </p>
            <form onSubmit={handleVoid} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Alasan Void *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Salah input paket atau metode bayar"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Konfirmasi Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
