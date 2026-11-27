"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { Locker } from "@/types/database";

export function LockersClient({
  initialLockers,
  members,
}: {
  initialLockers: Locker[];
  members: { id: string; full_name: string; member_code: string }[];
}) {
  const [lockers, setLockers] = useState(initialLockers);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");

  async function updateLocker(id: string, action: "assign" | "release" | "maintenance") {
    const res = await fetch("/api/lockers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, member_id: action === "assign" ? selectedMemberId : null }),
    });
    const data = await res.json();
    if (res.ok && data.lockers) setLockers(data.lockers);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Loker Member</h1>
          <p className="text-sm text-slate-500">Pantau ketersediaan loker dan pinjamkan kunci ke member yang check-in</p>
        </div>
        <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold">
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.member_code} · {m.full_name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {lockers.map((l) => (
          <div key={l.id} className={`rounded-2xl border p-4 shadow-sm ${l.status === "occupied" ? "border-blue-300 bg-blue-50/70" : l.status === "maintenance" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-extrabold text-slate-900">{l.code}</span>
              <KeyRound className={`h-4 w-4 ${l.status === "occupied" ? "text-blue-600" : "text-slate-400"}`} />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {l.status === "occupied" ? l.member_name : l.status === "maintenance" ? "Perbaikan" : "Tersedia"}
            </p>
            <div className="mt-3 flex gap-1.5">
              {l.status === "available" ? (
                <button type="button" onClick={() => updateLocker(l.id, "assign")} className="flex-1 rounded-lg bg-blue-600 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700">
                  Pinjamkan
                </button>
              ) : (
                <button type="button" onClick={() => updateLocker(l.id, "release")} className="flex-1 rounded-lg border border-blue-200 bg-white py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50">
                  Kosongkan
                </button>
              )}
              <button type="button" onClick={() => updateLocker(l.id, "maintenance")} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50">
                {l.status === "maintenance" ? "Aktifkan" : "Rusak"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
