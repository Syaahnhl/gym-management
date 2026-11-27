"use client";

import React from "react";
import { QrCode, Sparkles } from "lucide-react";

interface QrScanAnimationBoxProps {
  isScanning: boolean;
  onSimulateScan: () => void;
  demoCode?: string;
}

export function QrScanAnimationBox({
  isScanning,
  onSimulateScan,
  demoCode = "GYM-00001",
}: QrScanAnimationBoxProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-4 text-white">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Animated QR Viewfinder */}
        <div className="relative w-28 h-28 shrink-0 rounded-xl bg-slate-950/90 border border-blue-500/40 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Corner Brackets */}
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />

          <QrCode
            className={`w-14 h-14 transition-transform duration-300 ${
              isScanning ? "text-emerald-400 scale-110" : "text-blue-300/90"
            }`}
          />

          {/* Moving Laser Scan Line */}
          <div className="animate-qr-scan absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_2px_rgba(34,211,238,0.85)]" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] font-semibold text-blue-200">
            <Sparkles className="w-3 h-3" />
            Tanpa Catat Buku Manual
          </div>
          <p className="text-sm font-bold text-white">
            Scan QR Otomatis + Pantau BB & BMI
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Member cukup tunjukkan QR Code. Presensi langsung tercatat, status
            aktif tampil otomatis, dan berat badan/BMI bisa langsung diinput.
          </p>
          <button
            type="button"
            onClick={onSimulateScan}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            Simulasi Scan QR ({demoCode})
          </button>
        </div>
      </div>
    </div>
  );
}
