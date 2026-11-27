"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS, formatRupiah } from "@/lib/domain/format";
import { exportRowsToCsv, exportRowsToExcel } from "@/lib/export/excel";

interface ProfitLossReportData {
  revenue: {
    membership: number;
    daily: number;
    products: number;
    total: number;
  };
  cogs: number;
  expenses: {
    total: number;
    by_category: Record<string, number>;
  };
  net_profit: number;
}

export function ProfitLossClient({
  report,
  initialFrom,
  initialTo,
}: {
  report: ProfitLossReportData;
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/reports/profit-loss?${params.toString()}`);
  }

  const exportData = [
    { Komponen: "Pendapatan Membership", Nominal: report.revenue.membership },
    { Komponen: "Pendapatan Tiket Harian", Nominal: report.revenue.daily },
    { Komponen: "Pendapatan Produk POS", Nominal: report.revenue.products },
    { Komponen: "Total Pendapatan", Nominal: report.revenue.total },
    { Komponen: "Harga Modal Produk (HPP)", Nominal: -report.cogs },
    ...Object.entries(report.expenses.by_category).map(([cat, amt]) => ({
      Komponen: `Beban: ${EXPENSE_CATEGORY_LABELS[cat] || cat}`,
      Nominal: -amt,
    })),
    { Komponen: "Total Pengeluaran", Nominal: -report.expenses.total },
    { Komponen: "Laba Bersih", Nominal: report.net_profit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Laporan Laba Rugi
          </h1>
          <p className="text-sm text-slate-500">
            Laba bersih = Total Pendapatan - Harga Modal Produk - Total
            Pengeluaran
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportRowsToCsv(exportData, "laporan-laba-rugi")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(exportData, "laporan-laba-rugi", "LabaRugi")
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <form
        onSubmit={applyFilter}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Terapkan
        </button>
      </form>

      <div className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 border-b border-slate-200 pb-4 text-sm">
          <h2 className="font-bold text-slate-900">Pendapatan</h2>
          <div className="flex justify-between text-slate-600">
            <span>Membership (Daftar & Perpanjang)</span>
            <span>{formatRupiah(report.revenue.membership)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tiket Harian</span>
            <span>{formatRupiah(report.revenue.daily)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Penjualan Produk POS</span>
            <span>{formatRupiah(report.revenue.products)}</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-slate-900">
            <span>Total Pendapatan</span>
            <span className="text-emerald-600">
              {formatRupiah(report.revenue.total)}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-b border-slate-200 pb-4 text-sm">
          <h2 className="font-bold text-slate-900">
            Harga Modal & Pengeluaran
          </h2>
          <div className="flex justify-between text-slate-600">
            <span>Harga Modal Produk Terjual (HPP)</span>
            <span className="text-rose-600">-{formatRupiah(report.cogs)}</span>
          </div>
          {Object.entries(report.expenses.by_category).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between text-slate-600">
              <span>{EXPENSE_CATEGORY_LABELS[cat] || cat}</span>
              <span className="text-rose-600">-{formatRupiah(amt)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold text-slate-900">
            <span>Total HPP & Pengeluaran</span>
            <span className="text-rose-600">
              -{formatRupiah(report.cogs + report.expenses.total)}
            </span>
          </div>
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Laba Bersih</span>
          <span
            className={
              report.net_profit >= 0 ? "text-emerald-700" : "text-rose-700"
            }
          >
            {formatRupiah(report.net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
}
