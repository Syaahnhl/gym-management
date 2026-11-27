"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Printer } from "lucide-react";
import type { PaymentMethod, Shift } from "@/types/database";
import {
  PAYMENT_METHOD_LABELS,
  formatDateTimeWib,
  formatRupiah,
} from "@/lib/domain/format";

interface ShiftSummaryData {
  shift: Shift;
  transaction_count: number;
  total_revenue: number;
  by_method: Record<PaymentMethod, { count: number; total: number }>;
  cash_expenses_total?: number;
  expected_cash: number;
}

export function ShiftClient({
  openShift,
  openSummary,
  shifts,
}: {
  openShift: Shift | null;
  openSummary: ShiftSummaryData | null;
  shifts: (Shift & { cashier_name: string })[];
}) {
  const router = useRouter();
  const [openingCash, setOpeningCash] = useState(500000);
  const [actualCash, setActualCash] = useState(openSummary?.expected_cash ?? 0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const difference = openSummary
    ? Number(actualCash || 0) - openSummary.expected_cash
    : 0;

  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_cash: Number(openingCash) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuka shift");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseShift(e: React.FormEvent) {
    e.preventDefault();
    if (!openShift) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${openShift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actual_cash: Number(actualCash),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menutup shift");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Kasir</h1>
          <p className="text-sm text-slate-500">
            Buka shift, pantau kas tunai, dan tutup shift dengan rekap metode
            pembayaran
          </p>
        </div>
        {openShift && (
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Cetak Rekap Shift
          </button>
        )}
      </div>

      {!openShift ? (
        <form
          onSubmit={handleOpenShift}
          className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Buka Shift Baru</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Saldo Awal Kas (Rp)
            </label>
            <input
              type="number"
              min={0}
              required
              value={openingCash}
              onChange={(e) => setOpeningCash(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {loading ? "Membuka..." : "Buka Shift"}
          </button>
        </form>
      ) : (
        openSummary && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Rekap Shift Aktif
              </h2>
              <p className="text-xs text-slate-500">
                Dibuka pada {formatDateTimeWib(openShift.opened_at)}
              </p>

              <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Saldo Awal Kas</span>
                  <span className="font-semibold">
                    {formatRupiah(openShift.opening_cash)}
                  </span>
                </div>
                {(Object.keys(openSummary.by_method) as PaymentMethod[]).map(
                  (m) => (
                    <div key={m} className="flex justify-between">
                      <span className="text-slate-600">
                        {PAYMENT_METHOD_LABELS[m]} (
                        {openSummary.by_method[m].count}x)
                      </span>
                      <span className="font-semibold">
                        {formatRupiah(openSummary.by_method[m].total)}
                      </span>
                    </div>
                  )
                )}
                {(openSummary.cash_expenses_total ?? 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Pengeluaran Tunai Shift</span>
                    <span className="font-semibold">
                      -{formatRupiah(openSummary.cash_expenses_total ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Kas Tunai Seharusnya</span>
                  <span className="text-emerald-700">
                    {formatRupiah(openSummary.expected_cash)}
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCloseShift}
              className="no-print space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">Tutup Shift</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Kas Tunai Aktual di Laci (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  difference === 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                Selisih Kas: {formatRupiah(difference)}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Catatan {difference !== 0 ? "* (wajib jika ada selisih)" : "(opsional)"}
                </label>
                <textarea
                  rows={2}
                  required={difference !== 0}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                {loading ? "Menutup..." : "Tutup Shift Sekarang"}
              </button>
            </form>
          </div>
        )
      )}

      <div className="no-print overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3">
          <h3 className="font-bold text-slate-900">Riwayat Shift</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Kasir</th>
              <th className="px-4 py-3">Buka</th>
              <th className="px-4 py-3">Tutup</th>
              <th className="px-4 py-3">Kas Seharusnya</th>
              <th className="px-4 py-3">Kas Aktual</th>
              <th className="px-4 py-3">Selisih</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shifts.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {s.cashier_name}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(s.opened_at)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(s.closed_at)}
                </td>
                <td className="px-4 py-3">
                  {s.expected_cash !== null ? formatRupiah(s.expected_cash) : "-"}
                </td>
                <td className="px-4 py-3">
                  {s.actual_cash !== null ? formatRupiah(s.actual_cash) : "-"}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    s.difference && s.difference !== 0
                      ? "text-rose-600"
                      : "text-slate-700"
                  }`}
                >
                  {s.difference !== null ? formatRupiah(s.difference) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.status === "open"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {s.status === "open" ? "Terbuka" : "Ditutup"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
