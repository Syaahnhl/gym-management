"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { BodyMetric } from "@/types/database";
import { calculateBmi } from "@/lib/domain/bmi";
import { formatDateId } from "@/lib/domain/format";

interface MemberProgressTrackerProps {
  memberName: string;
  metrics: BodyMetric[];
  onSaveMetric: (payload: {
    weight_kg: number;
    height_cm: number;
    notes?: string;
  }) => Promise<void> | void;
  saving?: boolean;
}

export function MemberProgressTracker({
  memberName,
  metrics,
  onSaveMetric,
  saving = false,
}: MemberProgressTrackerProps) {
  const latest = metrics[0] || null;

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

  // Chronological order (oldest -> newest) for daily progress chart
  const chartData = useMemo(() => {
    const ordered = [...metrics].slice(0, 10).reverse();
    if (ordered.length === 0) return null;

    const weights = ordered.map((m) => m.weight_kg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const span = Math.max(2, maxW - minW);
    const padMin = minW - span * 0.2;
    const padMax = maxW + span * 0.2;

    const width = 340;
    const height = 130;
    const padX = 26;
    const padTop = 22;
    const padBottom = 26;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;

    const points = ordered.map((m, idx) => {
      const x =
        ordered.length === 1
          ? width / 2
          : padX + (idx / (ordered.length - 1)) * usableW;
      const ratio = (m.weight_kg - padMin) / (padMax - padMin || 1);
      const y = padTop + usableH - ratio * usableH;
      const bmi = calculateBmi(m.weight_kg, m.height_cm)?.bmi ?? null;
      return {
        id: m.id,
        x,
        y,
        weight: m.weight_kg,
        bmi,
        dateLabel: m.recorded_at.slice(5).replace("-", "/"),
      };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const areaPath =
      points.length > 1
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padBottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padBottom).toFixed(1)} Z`
        : "";

    const firstW = ordered[0].weight_kg;
    const lastW = ordered[ordered.length - 1].weight_kg;
    const totalDelta = Math.round((lastW - firstW) * 10) / 10;

    return { width, height, padBottom, points, linePath, areaPath, totalDelta };
  }, [metrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedWeight || !parsedHeight) return;
    await onSaveMetric({
      weight_kg: parsedWeight,
      height_cm: parsedHeight,
      notes: notesInput.trim() || "Catat progres harian",
    });
    setNotesInput("");
    setSavedNotice(
      `Progres harian tersimpan: ${parsedWeight} kg (BMI ${previewBmi?.bmi ?? "-"})`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Card 1: Input BB & Tinggi Badan + Hitung BMI */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Input Berat & Tinggi Badan
              </h3>
              <p className="text-[11px] text-slate-500">
                Catat progres harian & pantau BMI otomatis
              </p>
            </div>
          </div>
          {latestBmi && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${latestBmi.badgeClass}`}
            >
              BMI {latestBmi.bmi} • {latestBmi.category}
            </span>
          )}
        </div>

        {/* Live BMI Gauge */}
        {previewBmi && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Estimasi BMI: <strong>{previewBmi.bmi}</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${previewBmi.badgeClass}`}
              >
                {previewBmi.category}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full overflow-hidden flex bg-slate-200">
              <div className="w-[17.5%] bg-sky-400" />
              <div className="w-[32.5%] bg-emerald-500" />
              <div className="w-[25%] bg-amber-400" />
              <div className="w-[25%] bg-rose-500" />
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-slate-900 ring-2 ring-white rounded-full transition-all duration-300"
                style={{ left: `calc(${previewBmi.barPercent}% - 3px)` }}
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

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
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
                placeholder="cth: 72.5"
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
                placeholder="cth: 173"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Catatan progres (opsional, cth: Setelah cardio 30 menit)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !parsedWeight || !parsedHeight}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Progres Harian"}
          </button>
        </form>

        {savedNotice && (
          <div className="animate-scan-pop flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* Card 2: Grafik Progres Harian */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Grafik Progres Harian (BB & BMI)
            </h3>
            <p className="text-[11px] text-slate-500">
              Tren perubahan berat badan dari catatan harian Anda
            </p>
          </div>
          {chartData && chartData.points.length > 1 && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                chartData.totalDelta <= 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {chartData.totalDelta <= 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {chartData.totalDelta > 0
                ? `+${chartData.totalDelta}`
                : chartData.totalDelta}{" "}
              kg
            </span>
          )}
        </div>

        {chartData ? (
          <>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 overflow-hidden">
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-36 overflow-visible"
              >
                <defs>
                  <linearGradient id="bbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {chartData.areaPath && (
                  <path d={chartData.areaPath} fill="url(#bbAreaGrad)" />
                )}

                {chartData.points.length > 1 && (
                  <path
                    d={chartData.linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chartData.points.map((pt) => (
                  <g key={pt.id}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 9}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {pt.weight}kg
                    </text>
                    <text
                      x={pt.x}
                      y={chartData.height - 6}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="#64748b"
                    >
                      {pt.dateLabel}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {chartData.points.length === 1 && (
              <p className="text-[11px] text-slate-500 text-center">
                Tambahkan catatan BB di hari berikutnya untuk melihat garis tren
                grafik harian.
              </p>
            )}

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {metrics.slice(0, 6).map((m) => {
                const bmi = calculateBmi(m.weight_kg, m.height_cm);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {formatDateId(m.recorded_at)}
                      </p>
                      {m.notes && (
                        <p className="text-[10px] text-slate-500">{m.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {m.weight_kg} kg • {m.height_cm} cm
                      </p>
                      <p className="text-[10px] font-semibold text-blue-600">
                        BMI {bmi?.bmi ?? "-"} ({bmi?.category ?? "-"})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            Belum ada catatan progres harian. Silakan input berat & tinggi badan
            Anda di atas.
          </p>
        )}
      </div>
    </div>
  );
}
