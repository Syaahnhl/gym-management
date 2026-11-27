"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { PtSession, StaffRole, Trainer } from "@/types/database";
import { formatDateId, formatRupiah } from "@/lib/domain/format";

type SessionRow = PtSession & { member_name: string; trainer_name: string };

export function TrainersClient({
  initialTrainers,
  initialSessions,
  members,
  staffRole,
  todayStr,
}: {
  initialTrainers: Trainer[];
  initialSessions: SessionRow[];
  members: { id: string; full_name: string; member_code: string }[];
  staffRole: StaffRole;
  todayStr: string;
}) {
  const router = useRouter();
  const [trainers, setTrainers] = useState(initialTrainers);
  const [sessions, setSessions] = useState(initialSessions);

  // New trainer form
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tSpecialty, setTSpecialty] = useState("");
  const [tCommType, setTCommType] = useState<"percent" | "fixed">("percent");
  const [tCommVal, setTCommVal] = useState(40);

  // New PT session form
  const [memberId, setMemberId] = useState(members[0]?.id || "");
  const [trainerId, setTrainerId] = useState(
    initialTrainers.find((t) => t.is_active)?.id || ""
  );
  const [sessionDate, setSessionDate] = useState(todayStr);
  const [sessionTime, setSessionTime] = useState("10:00");
  const [sessionFee, setSessionFee] = useState(250000);

  async function addTrainer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tName,
        phone: tPhone,
        specialty: tSpecialty,
        commission_type: tCommType,
        commission_value: Number(tCommVal),
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setTrainers((prev) => [...prev, d.trainer]);
      setTName("");
      setTPhone("");
      setTSpecialty("");
    }
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/pt-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        trainerId,
        sessionDate,
        sessionTime,
        sessionFee: Number(sessionFee),
      }),
    });
    if (res.ok) {
      router.refresh();
      window.location.reload();
    }
  }

  async function updateSession(id: string, status: "completed" | "cancelled") {
    const res = await fetch("/api/pt-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Personal Trainer & Sesi PT
        </h1>
        <p className="text-sm text-slate-500">
          Kelola trainer, jadwal sesi PT, dan komisi otomatis
        </p>
      </div>

      {staffRole === "owner" && (
        <form
          onSubmit={addTrainer}
          className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-6"
        >
          <input
            required
            placeholder="Nama Trainer"
            value={tName}
            onChange={(e) => setTName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="No. HP"
            value={tPhone}
            onChange={(e) => setTPhone(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Spesialisasi"
            value={tSpecialty}
            onChange={(e) => setTSpecialty(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={tCommType}
            onChange={(e) =>
              setTCommType(e.target.value as "percent" | "fixed")
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="percent">Komisi %</option>
            <option value="fixed">Komisi Tetap (Rp)</option>
          </select>
          <input
            type="number"
            min={0}
            value={tCommVal}
            onChange={(e) => setTCommVal(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Trainer
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="font-bold text-slate-900">{t.name}</p>
            <p className="text-xs text-slate-500">
              {t.specialty || "General Fitness"} · {t.phone}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Komisi:{" "}
              {t.commission_type === "percent"
                ? `${t.commission_value}%`
                : formatRupiah(t.commission_value)}
              /sesi
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={addSession}
        className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-6"
      >
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
        <select
          value={trainerId}
          onChange={(e) => setTrainerId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {trainers
            .filter((t) => t.is_active)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={sessionTime}
          onChange={(e) => setSessionTime(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          value={sessionFee}
          onChange={(e) => setSessionFee(Number(e.target.value))}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          + Jadwal PT
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tanggal & Jam</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Biaya Sesi</th>
              <th className="px-4 py-3">Komisi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-xs">
                  {formatDateId(s.session_date)} · {s.session_time}
                </td>
                <td className="px-4 py-3 font-medium">{s.member_name}</td>
                <td className="px-4 py-3">{s.trainer_name}</td>
                <td className="px-4 py-3">{formatRupiah(s.session_fee)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-700">
                  {formatRupiah(s.commission_amount)}
                </td>
                <td className="px-4 py-3 uppercase text-xs">{s.status}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {s.status === "scheduled" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateSession(s.id, "completed")}
                        className="rounded bg-emerald-600 px-2.5 py-1 text-xs text-white"
                      >
                        Selesai
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSession(s.id, "cancelled")}
                        className="rounded border px-2.5 py-1 text-xs"
                      >
                        Batal
                      </button>
                    </>
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
