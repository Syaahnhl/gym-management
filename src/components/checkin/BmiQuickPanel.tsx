"use client";

import React, { useEffect, useState } from "react";
import { Activity, Scale, TrendingDown, TrendingUp } from "lucide-react";
import type { BodyMetric } from "@/types/database";
import { calculateBmi } from "@/lib/domain/bmi";
import { formatDateId } from "@/lib/domain/format";

interface BmiQuickPanelProps {
  memberName: string;
  metrics: BodyMetric[];
  onSaveMetric: (payload: {
    weight_kg: number;
    height_cm: number;
    notes?: string;
  }) => Promise<void> | void;
  saving?: boolean;
}

export function BmiQuickPanel({
  memberName,
  metrics,
  onSaveMetric,
  saving = false,
}: BmiQuickPanelProps) {
  const latest = metrics[0] || null;
  const previous = metrics[1] || null;

  const [weightInput, setWeightInput] = useState(
    latest ? String(latest.weight_kg) : "",
  );
  const [heightInput, setHeightInput] = useState(
    latest ? String(latest.height_cm) : "170",
  );
  const [notesInput, setNotesInput] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setWeightInput(latest ? String(latest.weight_kg) : "");
    setHeightInput(latest ? String(latest.height_cm) : "170");
    setSavedNotice(null);
  }, [latest?.id, memberName]);

  const parsedWeight = Number(weightInput);
  const parsedHeight = Number(heightInput);
  const previewBmi = calculateBmi(parsedWeight, parsedHeight);
  const latestBmi = latest
    ? calculateBmi(latest.weight_kg, latest.height_cm)
    : null;

  const deltaKg =
    latest && previous
      ? Math.round((latest.weight_kg - previous.weight_kg) * 10) / 10
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedWeight || !parsedHeight) return;
    await onSaveMetric({
      weight_kg: parsedWeight,
      height_cm: parsedHeight,
      notes: notesInput.trim() || "Timbang saat presensi QR",
    });
    setNotesInput("");
    setSavedNotice(
      `BB ${parsedWeight} kg (BMI ${previewBmi?.bmi ?? "-"}) tersimpan!`,
    );
  };

  return (
    <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-4 text-slate-900 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Input BB & Pantau BMI
            </h3>
            <p className="text-[11px] text-slate-500">
              Otomatis tercatat saat check-in tanpa tulis manual
            </p>
          </div>
        </div>
        {latestBmi && (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${latestBmi.badgeClass}`}
          >
            BMI {latestBmi.bmi} • {latestBmi.category}
          </span>
        )}
      </div>

      {/* Latest Summary & Delta */}
      {latest && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">
              BB Terakhir
            </p>
            <p className="text-sm font-bold text-slate-900">
              {latest.weight_kg} kg
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">
              Tinggi
            </p>
            <p className="text-sm font-bold text-slate-900">
              {latest.height_cm} cm
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">
              Perubahan
            </p>
            {deltaKg !== null ? (
              <p
                className={`text-sm font-bold inline-flex items-center gap-0.5 ${
                  deltaKg <= 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {deltaKg <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {deltaKg > 0 ? `+${deltaKg}` : deltaKg} kg
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Data awal
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live BMI Gauge */}
      {previewBmi && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Preview BMI: <strong>{previewBmi.bmi}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${previewBmi.badgeClass}`}
            >
              {previewBmi.category}
            </span>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden flex bg-slate-100">
            <div className="w-[17.5%] bg-sky-400" title="Kurus (<18.5)" />
            <div className="w-[32.5%] bg-emerald-500" title="Normal (18.5-24.9)" />
            <div className="w-[25%] bg-amber-400" title="Overweight (25-29.9)" />
            <div className="w-[25%] bg-rose-500" title="Obesitas (>=30)" />
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 ring-2 ring-white rounded-full transition-all duration-300"
              style={{ left: `calc(${previewBmi.barPercent}% - 2px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Kurus</span>
            <span>Normal</span>
            <span>Overweight</span>
            <span>Obesitas</span>
          </div>
        </div>
      )}

      {/* Quick Weight & Height Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Berat Badan (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="25"
              max="250"
              required
              placeholder="cth: 68.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              min="100"
              max="230"
              required
              placeholder="cth: 170"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Catatan (opsional, cth: Pagi sebelum latihan)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !parsedWeight || !parsedHeight}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan BB & BMI"}
          </button>
        </div>
        {savedNotice && (
          <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            {savedNotice}
          </p>
        )}
      </form>

      {/* Mini History */}
      {metrics.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">
            Riwayat Pantau BB ({metrics.length})
          </p>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {metrics.slice(0, 4).map((m) => {
              const b = calculateBmi(m.weight_kg, m.height_cm);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50"
                >
                  <span className="text-slate-500">
                    {formatDateId(m.recorded_at)}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {m.weight_kg} kg
                  </span>
                  <span className="text-blue-600 font-semibold">
                    BMI {b?.bmi ?? "-"} ({b?.category ?? "-"})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
