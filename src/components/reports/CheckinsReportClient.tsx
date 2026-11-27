"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { formatDateTimeWib } from "@/lib/domain/format";
import { exportRowsToCsv, exportRowsToExcel } from "@/lib/export/excel";

interface CheckinRow {
  id: string;
  date: string;
  checked_in_at: string;
  name: string;
  code: string;
  method: string;
  is_duplicate: boolean;
}

export function CheckinsReportClient({ rows }: { rows: CheckinRow[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  }, [rows, from, to]);

  const exportData = filtered.map((r) => ({
    Waktu: formatDateTimeWib(r.checked_in_at),
    Kode: r.code,
    Nama: r.name,
    Metode: r.method,
    Duplikat: r.is_duplicate ? "Ya" : "Tidak",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Check-in</h1>
          <p className="text-sm text-slate-500">
            Riwayat kunjungan member dan tiket harian
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportRowsToCsv(exportData, "laporan-checkin")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(exportData, "laporan-checkin", "Checkin")
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
          <p className="text-xs text-slate-500">Total Kunjungan</p>
          <p className="text-2xl font-bold text-slate-900">
            {filtered.length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu (WIB)</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(r.checked_in_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 uppercase text-xs">{r.method}</td>
                <td className="px-4 py-3 text-xs">
                  {r.is_duplicate ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                      Duplikat Hari Ini
                    </span>
                  ) : (
                    "Normal"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
