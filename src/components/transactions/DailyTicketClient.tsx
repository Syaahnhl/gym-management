"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Package, PaymentMethod } from "@/types/database";
import { formatRupiah } from "@/lib/domain/format";

export function DailyTicketClient({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(packages[0]?.price || 50000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pkg = packages.find((p) => p.id === packageId);
  const total = pkg?.price ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily",
          guestName,
          guestPhone,
          packageId,
          paymentMethod,
          cashReceived:
            paymentMethod === "cash" ? Number(cashReceived || 0) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses tiket harian");
        return;
      }
      router.push(`/transactions/${data.transaction.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tiket Harian (Walk-in)
        </h1>
        <p className="text-sm text-slate-500">
          Pengunjung harian cukup isi nama & nomor HP, check-in tercatat
          otomatis
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nama Pengunjung *
          </label>
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nomor HP *
          </label>
          <input
            required
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Paket Harian
          </label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatRupiah(p.price)}
              </option>
            ))}
          </select>
        </div>
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
          {loading ? "Memproses..." : "Bayar & Catat Check-in"}
        </button>
      </form>
    </div>
  );
}
