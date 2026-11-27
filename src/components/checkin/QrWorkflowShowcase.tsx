"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  QrCode,
  Scale,
  Sparkles,
  TrendingDown,
} from "lucide-react";

const STEPS = [
  { id: 0, label: "1. Scan QR", short: "Scan QR" },
  { id: 1, label: "2. Isi Progres BB & BMI", short: "Isi Progres" },
  { id: 2, label: "3. Selesai", short: "Selesai" },
] as const;

export function QrWorkflowShowcase() {
  const [step, setStep] = useState<number>(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(timer);
  }, [paused]);

  const handleSelectStep = (idx: number) => {
    setStep(idx);
    setPaused(true);
  };

  return (
    <div
      className="rounded-3xl border border-blue-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-4 sm:p-6 text-white shadow-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top Header + Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold text-blue-200 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          Alur Otomatis Tanpa Buku Tamu
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStep(s.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                <span className="truncate">{s.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Stage */}
      <div className="min-h-[210px] rounded-2xl bg-slate-950/70 border border-slate-800/90 p-4 sm:p-5 flex items-center justify-center">
        {step === 0 && (
          <div
            key="step-scan"
            className="animate-scan-pop w-full flex flex-col sm:flex-row items-center gap-5"
          >
            <div className="relative w-32 h-32 shrink-0 rounded-2xl bg-slate-900 border-2 border-blue-500/50 flex items-center justify-center overflow-hidden shadow-inner">
              <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
              <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
              <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
              <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />
              <QrCode className="w-16 h-16 text-blue-300" />
              <div className="animate-qr-scan absolute inset-x-2 h-0.5 bg-cyan-400 shadow-[0_0_12px_3px_rgba(34,211,238,0.85)]" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                Tahap 1 • Scan QR Member
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Memindai Kartu QR Member...
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Member cukup arahkan QR Code ke kamera atau scanner. Sistem
                langsung mengenali <strong>Andi Pratama (GYM-00001)</strong>{" "}
                dan mengecek masa aktif paket.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div
            key="step-progress"
            className="animate-scan-pop w-full space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                <Scale className="w-3 h-3" />
                Tahap 2 • Isi Progres BB & BMI
              </span>
              <span className="text-xs font-semibold text-emerald-300 inline-flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Turun 0.4 kg dari minggu lalu
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-2.5">
                <p className="text-[10px] text-slate-400">Berat Badan</p>
                <p className="text-base font-bold text-white mt-0.5">
                  72.4 <span className="text-xs font-normal">kg</span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-2.5">
                <p className="text-[10px] text-slate-400">Tinggi Badan</p>
                <p className="text-base font-bold text-white mt-0.5">
                  173 <span className="text-xs font-normal">cm</span>
                </p>
              </div>
              <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-2.5">
                <p className="text-[10px] text-emerald-300">BMI Otomatis</p>
                <p className="text-base font-bold text-emerald-300 mt-0.5">
                  24.2{" "}
                  <span className="text-[10px] font-semibold">Normal</span>
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  Indikator BMI: Normal (Ideal)
                </span>
                <span>18.5 – 24.9</span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden flex bg-slate-800">
                <div className="w-[17.5%] bg-sky-400" />
                <div className="w-[32.5%] bg-emerald-500" />
                <div className="w-[25%] bg-amber-400" />
                <div className="w-[25%] bg-rose-500" />
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]"
                  style={{ left: "45%" }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div
            key="step-done"
            className="animate-scan-pop w-full text-center space-y-3 py-2"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                Tahap 3 • Selesai
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">
                Presensi & Progres BB/BMI Tersimpan!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                Andi Pratama tercatat hadir otomatis, grafik BB & BMI terupdate
                di Portal Member tanpa perlu catat nama dan tanggal di buku.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {paused
            ? "Mode manual (klik tahap di atas untuk lihat animasi)"
            : "Animasi otomatis berjalan • Arahkan kursor untuk jeda"}
        </span>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStep(s.id)}
              aria-label={s.label}
              className={`h-1.5 rounded-full transition-all ${
                step === s.id ? "w-5 bg-cyan-400" : "w-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
