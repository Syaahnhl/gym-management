"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PauseCircle } from "lucide-react";
import type { Freeze, FreezeReason, StaffRole } from "@/types/database";
import { formatDateId, formatRupiah } from "@/lib/domain/format";
import { addDaysToDateStr } from "@/lib/domain/membership";

type FreezeRow = Freeze & { member_name: string; member_code: string };

const REASON_LABELS: Record<FreezeReason, string> = {
  sakit: "Sakit",
  dinas: "Dinas Luar Kota",
  lainnya: "Lainnya",
};

export function FreezesClient({
  initialFreezes,
  activeMembers,
  staffRole,
  todayStr,
}: {
  initialFreezes: FreezeRow[];
  activeMembers: { id: string; member_code: string; full_name: string }[];
  staffRole: StaffRole;
  todayStr: string;
}) {
  const router = useRouter();
  const [freezes, setFreezes] = useState(initialFreezes);
  const [modalOpen, setModalOpen] = useState(false);
  const [memberId, setMemberId] = useState(activeMembers[0]?.id || "");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(addDaysToDateStr(todayStr, 6));
  const [reason, setReason] = useState<FreezeReason>("sakit");
  const [reasonNotes, setReasonNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/freezes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        startDate,
        endDate,
        reason,
        reasonNotes: reasonNotes || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal mengajukan freeze");
      return;
    }
    setModalOpen(false);
    router.refresh();
    window.location.reload();
  }

  async function handleFinishEarly(id: string) {
    if (!confirm("Akhiri freeze lebih awal hari ini? Sisa hari akan dikembalikan.")) {
      return;
    }
    const res = await fetch(`/api/freezes/${id}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualEndDate: todayStr }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal mengakhiri freeze");
      return;
    }
    setFreezes((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data.freeze } : f))
    );
    router.refresh();
  }

  async function handleCancel(id: string) {
    const cancelReason = prompt("Masukkan alasan pembatalan freeze (wajib):");
    if (!cancelReason) return;
    const res = await fetch(`/api/freezes/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal membatalkan freeze");
      return;
    }
    setFreezes((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data.freeze } : f))
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Freeze / Cuti Membership
          </h1>
          <p className="text-sm text-slate-500">
            Selama freeze, member tidak dapat check-in dan masa aktif otomatis
            diperpanjang
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          <PauseCircle className="h-4 w-4" />
          Ajukan Freeze
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Periode Rencana</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Biaya</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {freezes.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {f.member_name}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    {f.member_code}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-700">
                  {formatDateId(f.start_date)} – {formatDateId(f.end_date)}
                  {f.actual_end_date && (
                    <div className="text-emerald-700">
                      Selesai aktual: {formatDateId(f.actual_end_date)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{REASON_LABELS[f.reason]}</div>
                  {f.reason_notes && (
                    <div className="text-xs text-slate-500">{f.reason_notes}</div>
                  )}
                </td>
                <td className="px-4 py-3">{formatRupiah(f.fee)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      f.status === "active"
                        ? "bg-cyan-100 text-cyan-800"
                        : f.status === "finished"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {f.status === "active"
                      ? "Aktif"
                      : f.status === "finished"
                      ? "Selesai"
                      : "Dibatalkan"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {f.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleFinishEarly(f.id)}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Akhiri Lebih Awal
                    </button>
                  )}
                  {staffRole === "owner" && f.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(f.id)}
                      className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Batalkan
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {freezes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Belum ada pengajuan freeze.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Ajukan Freeze Membership
            </h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Member Aktif
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Alasan
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as FreezeReason)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="sakit">Sakit</option>
                  <option value="dinas">Dinas</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Keterangan Tambahan
                </label>
                <input
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Simpan Freeze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
