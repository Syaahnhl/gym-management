"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  formatDateId,
  formatRupiah,
} from "@/lib/domain/format";
import { exportRowsToCsv, exportRowsToExcel } from "@/lib/export/excel";

interface RevenueRow {
  id: string;
  invoice_number: string;
  date: string;
  created_at: string;
  type: string;
  customer: string;
  package_name: string;
  payment_method: string;
  cashier_name: string;
  total: number;
}

export function RevenueReportClient({ rows }: { rows: RevenueRow[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }, [rows, from, to]);

  const totalRevenue = filtered.reduce((acc, r) => acc + r.total, 0);

  const byMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      map[r.payment_method] = (map[r.payment_method] || 0) + r.total;
    }
    return Object.entries(map);
  }, [filtered]);

  const byPackage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      map[r.package_name] = (map[r.package_name] || 0) + r.total;
    }
    return Object.entries(map);
  }, [filtered]);

  const byCashier = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      map[r.cashier_name] = (map[r.cashier_name] || 0) + r.total;
    }
    return Object.entries(map);
  }, [filtered]);

  const exportData = filtered.map((r) => ({
    Invoice: r.invoice_number,
    Tanggal: r.date,
    Pelanggan: r.customer,
    Paket: r.package_name,
    Metode: PAYMENT_METHOD_LABELS[r.payment_method] || r.payment_method,
    Kasir: r.cashier_name,
    Total: r.total,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Laporan Pendapatan
          </h1>
          <p className="text-sm text-slate-500">
            Hanya menghitung transaksi berstatus lunas (paid)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportRowsToCsv(exportData, "laporan-pendapatan")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(exportData, "laporan-pendapatan", "Pendapatan")
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
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
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500">
            Total Pendapatan ({filtered.length} transaksi)
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">
            Per Metode Pembayaran
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {byMethod.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-600">
                  {PAYMENT_METHOD_LABELS[k] || k}
                </span>
                <span className="font-semibold">{formatRupiah(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Per Paket</h2>
          <div className="mt-3 space-y-2 text-sm">
            {byPackage.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-600">{k}</span>
                <span className="font-semibold">{formatRupiah(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Per Kasir</h2>
          <div className="mt-3 space-y-2 text-sm">
            {byCashier.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-600">{k}</span>
                <span className="font-semibold">{formatRupiah(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Paket</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Kasir</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateId(r.date)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.invoice_number}</td>
                <td className="px-4 py-3 font-medium">{r.customer}</td>
                <td className="px-4 py-3">{r.package_name}</td>
                <td className="px-4 py-3">
                  {PAYMENT_METHOD_LABELS[r.payment_method]}
                </td>
                <td className="px-4 py-3">{r.cashier_name}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatRupiah(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
