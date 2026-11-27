"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import type { BodyMetric } from "@/types/database";
import { formatDateId } from "@/lib/domain/format";

export function BodyMetricsClient({
  initialMetrics,
  members,
}: {
  initialMetrics: BodyMetric[];
  members: { id: string; full_name: string; member_code: string; gender: "L" | "P" | null }[];
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [weight, setWeight] = useState(72);
  const [height, setHeight] = useState(172);
  const [bodyFat, setBodyFat] = useState(18.5);
  const [muscle, setMuscle] = useState(33.5);
  const [notes, setNotes] = useState("");

  const bmi = height > 0 ? weight / ((height / 100) * (height / 100)) : 0;
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * 28 + 5);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: memberId,
        weight_kg: weight,
        height_cm: height,
        body_fat_percent: bodyFat,
        muscle_mass_kg: muscle,
        notes,
      }),
    });
    const data = await res.json();
    if (res.ok && data.metric) {
      setMetrics([data.metric, ...metrics]);
      setNotes("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Body Metrics, BMI &amp; BMR Tracker</h1>
        <p className="text-sm text-slate-500">Catat progres berat badan, % lemak, massa otot &amp; hitung BMI/BMR member</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2 text-blue-700">
            <Activity className="h-5 w-5" />
            <h2 className="text-sm font-bold">Input Pengukuran Baru</h2>
          </div>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs">
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.member_code} · {m.full_name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Berat (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Tinggi (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Body Fat (%)</label>
              <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Massa Otot (kg)</label>
              <input type="number" step="0.1" value={muscle} onChange={(e) => setMuscle(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-blue-50 p-3 text-xs">
            <div>
              <span className="text-slate-500">Estimasi BMI: </span>
              <strong className="text-blue-700">{bmi.toFixed(1)}</strong>
            </div>
            <div>
              <span className="text-slate-500">Estimasi BMR: </span>
              <strong className="text-blue-700">{bmr} kkal/hari</strong>
            </div>
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan evaluasi..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
            Simpan Progress Member
          </button>
        </form>

        <div className="space-y-2.5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm lg:col-span-7">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Pengukuran ({metrics.length})</h2>
          {metrics.map((bm) => {
            const m = members.find((x) => x.id === bm.member_id);
            const bmBmi = bm.height_cm > 0 ? bm.weight_kg / ((bm.height_cm / 100) ** 2) : 0;
            return (
              <div key={bm.id} className="rounded-xl bg-slate-50 p-3.5 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{m?.full_name ?? bm.member_id}</span>
                  <span className="text-blue-600">{formatDateId(bm.recorded_at)}</span>
                </div>
                <p className="mt-1 text-slate-600">
                  BB: <strong>{bm.weight_kg} kg</strong> · TB: {bm.height_cm} cm · BMI: <strong>{bmBmi.toFixed(1)}</strong>
                  {bm.body_fat_percent !== null && ` · Fat: ${bm.body_fat_percent}%`}
                  {bm.muscle_mass_kg !== null && ` · Otot: ${bm.muscle_mass_kg} kg`}
                </p>
                {bm.notes && <p className="mt-1 text-slate-500">{bm.notes}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
