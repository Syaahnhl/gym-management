"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClassSchedule, StaffRole, Trainer } from "@/types/database";
import { formatDateId } from "@/lib/domain/format";

type ClassRow = ClassSchedule & { trainer_name: string; booked_count: number };

export function ClassesClient({
  initialClasses,
  trainers,
  members,
  staffRole,
  todayStr,
}: {
  initialClasses: ClassRow[];
  trainers: Trainer[];
  members: { id: string; full_name: string; member_code: string }[];
  staffRole: StaffRole;
  todayStr: string;
}) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [title, setTitle] = useState("");
  const [trainerId, setTrainerId] = useState(trainers[0]?.id || "");
  const [classDate, setClassDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [maxCap, setMaxCap] = useState(15);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || "");

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        trainer_id: trainerId || null,
        class_date: classDate,
        start_time: startTime,
        end_time: endTime,
        max_capacity: Number(maxCap),
      }),
    });
    if (res.ok) {
      setTitle("");
      router.refresh();
      window.location.reload();
    }
  }

  async function book(classId: string) {
    const res = await fetch(`/api/classes/${classId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedMemberId }),
    });
    const d = await res.json();
    if (!res.ok) {
      alert(d.error || "Gagal booking kelas");
      return;
    }
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, booked_count: c.booked_count + 1 } : c
      )
    );
    alert("Booking kelas berhasil!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jadwal Kelas</h1>
        <p className="text-sm text-slate-500">
          Kelola jadwal kelas grup dan booking peserta
        </p>
      </div>

      {staffRole === "owner" && (
        <form
          onSubmit={addClass}
          className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-6"
        >
          <input
            required
            placeholder="Nama Kelas (cth: Yoga)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            value={maxCap}
            onChange={(e) => setMaxCap(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            + Buat Kelas
          </button>
        </form>
      )}

      <div className="flex items-center gap-3 rounded-2xl border bg-white p-4">
        <span className="text-sm font-medium">Pilih Member untuk Booking:</span>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} ({m.member_code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{c.title}</h2>
            <p className="text-xs text-slate-500">
              {formatDateId(c.class_date)} · {c.start_time}–{c.end_time}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Instruktur: {c.trainer_name}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Kuota: {c.booked_count} / {c.max_capacity}
              </span>
              <button
                type="button"
                disabled={c.booked_count >= c.max_capacity}
                onClick={() => book(c.id)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {c.booked_count >= c.max_capacity ? "Penuh" : "Booking"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
