"use client";

import { Download } from "lucide-react";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateId } from "@/lib/domain/format";
import { exportRowsToCsv, exportRowsToExcel } from "@/lib/export/excel";

export function MembersReportClient({
  members,
}: {
  members: MemberWithStatus[];
}) {
  const activeCount = members.filter(
    (m) => m.status_info.status === "active" || m.status_info.status === "expiring"
  ).length;
  const expiringCount = members.filter(
    (m) => m.status_info.status === "expiring"
  ).length;
  const expiredCount = members.filter(
    (m) => m.status_info.status === "expired"
  ).length;
  const churn30 = members.filter(
    (m) =>
      m.status_info.status === "expired" &&
      (m.status_info.remaining_days ?? -999) >= -30
  ).length;

  const exportData = members.map((m) => ({
    Kode: m.member_code,
    Nama: m.full_name,
    NoHP: m.phone,
    Status: m.status_info.label,
    TanggalMulai: m.status_info.start_date || "-",
    TanggalHabis: m.status_info.end_date || "-",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Member</h1>
          <p className="text-sm text-slate-500">
            Ringkasan status keanggotaan dan churn (habis tidak memperpanjang)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportRowsToCsv(exportData, "laporan-member")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(exportData, "laporan-member", "Member")
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Member Aktif</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Akan Habis</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {expiringCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Habis (Total)</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {expiredCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Churn (Habis 30 Hr Terakhir)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{churn30}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">No. HP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tanggal Habis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-mono text-xs">{m.member_code}</td>
                <td className="px-4 py-3 font-medium">{m.full_name}</td>
                <td className="px-4 py-3">{m.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status_info.status} />
                </td>
                <td className="px-4 py-3">
                  {formatDateId(m.status_info.end_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
