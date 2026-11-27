"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Package, PaymentMethod, StaffRole } from "@/types/database";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateId, formatRupiah } from "@/lib/domain/format";

export function RenewClient({
  member,
  packages,
  staffRole,
  maxCashierDiscount,
}: {
  member: MemberWithStatus;
  packages: Package[];
  staffRole: StaffRole;
  maxCashierDiscount: number;
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pkg = packages.find((p) => p.id === packageId);
  const total = Math.max(0, (pkg?.price ?? 0) - Number(discount || 0));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "renewal",
          memberId: member.id,
          packageId,
          discount: Number(discount || 0),
          discountReason: discountReason || undefined,
          paymentMethod,
          cashReceived:
            paymentMethod === "cash" ? Number(cashReceived || 0) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses perpanjangan");
        return;
      }
      router.push(`/transactions/${data.transaction.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Perpanjang Membership
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {member.full_name}
          </span>
          <span>({member.member_code})</span>
          <StatusBadge status={member.status_info.status} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Masa aktif saat ini s/d:{" "}
          <strong>{formatDateId(member.status_info.end_date)}</strong>. Jika
          masih aktif, perpanjangan otomatis disambung dari tanggal habis lama.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Pilih Paket
          </label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.duration_days} hari) - {formatRupiah(p.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Diskon (Rp){" "}
            {staffRole === "cashier" && (
              <span className="text-xs text-slate-400">
                (maks {formatRupiah(maxCashierDiscount)})
              </span>
            )}
          </label>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {discount > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alasan Diskon *
            </label>
            <input
              required
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Metode Pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
            <option value="card">Kartu Debit/Kredit (EDC)</option>
          </select>
        </div>

        {paymentMethod === "cash" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Uang Diterima (Rp) *
            </label>
            <input
              type="number"
              min={total}
              required
              value={cashReceived}
              onChange={(e) => setCashReceived(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex justify-between rounded-xl bg-slate-50 p-4 text-base font-bold text-slate-900">
          <span>Total Bayar</span>
          <span>{formatRupiah(total)}</span>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {loading ? "Memproses..." : "Simpan Perpanjangan"}
        </button>
      </form>
    </div>
  );
}
