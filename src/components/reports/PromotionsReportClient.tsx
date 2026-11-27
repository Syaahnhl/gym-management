"use client";

import { Download } from "lucide-react";
import type { Promotion } from "@/types/database";
import { formatDateId, formatRupiah } from "@/lib/domain/format";
import { exportRowsToCsv, exportRowsToExcel } from "@/lib/export/excel";

type PromoReportRow = Promotion & {
  usage_count: number;
  total_discount: number;
};

export function PromotionsReportClient({ rows }: { rows: PromoReportRow[] }) {
  const exportData = rows.map((r) => ({
    Nama: r.name,
    Kode: r.code || "-",
    Pemakaian: r.usage_count,
    TotalDiskon: r.total_discount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Promo</h1>
          <p className="text-sm text-slate-500">
            Jumlah pemakaian dan total diskon yang diberikan per promo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportRowsToCsv(exportData, "laporan-promo")}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(exportData, "laporan-promo", "Promo")
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama Promo</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Periode</th>
              <th className="px-4 py-3">Pemakaian</th>
              <th className="px-4 py-3 text-right">Total Diskon</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.code || "-"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateId(r.start_date)} – {formatDateId(r.end_date)}
                </td>
                <td className="px-4 py-3 font-semibold">{r.usage_count}x</td>
                <td className="px-4 py-3 text-right font-semibold text-rose-600">
                  {formatRupiah(r.total_discount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
