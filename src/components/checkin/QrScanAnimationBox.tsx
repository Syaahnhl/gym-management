"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, QrCode, Sparkles } from "lucide-react";

interface QrScanAnimationBoxProps {
  isScanning: boolean;
  onSimulateScan: () => void;
  onDetectedCode?: (code: string) => void;
  demoCode?: string;
}

export function QrScanAnimationBox({
  isScanning,
  onSimulateScan,
  onDetectedCode,
  demoCode = "GYM-00001",
}: QrScanAnimationBoxProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let rafId = 0;

    async function startCamera() {
      setCameraError(null);
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser ini tidak mendukung akses kamera.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const BarcodeDetectorCtor = (
          window as unknown as {
            BarcodeDetector?: new (opts?: { formats?: string[] }) => {
              detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
            };
          }
        ).BarcodeDetector;

        if (!BarcodeDetectorCtor) {
          setCameraError(
            "Kamera aktif, namun deteksi QR otomatis hanya tersedia di Chrome/Edge terbaru. Gunakan input kode atau simulasi.",
          );
          return;
        }

        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            if (videoRef.current.readyState >= 2) {
              const codes = await detector.detect(videoRef.current);
              const val = codes[0]?.rawValue?.trim();
              if (val) {
                setCameraOpen(false);
                onDetectedCode?.(val);
                return;
              }
            }
          } catch {
            // ignore transient frame errors
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch {
        setCameraError("Izin kamera ditolak atau kamera tidak ditemukan.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, onDetectedCode]);

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-4 text-white space-y-3">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Animated QR Viewfinder */}
        <div className="relative w-28 h-28 shrink-0 rounded-xl bg-slate-950/90 border border-blue-500/40 flex items-center justify-center overflow-hidden shadow-inner">
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-sm" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-sm" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-sm" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-sm" />

          {cameraOpen ? (
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <QrCode
              className={`w-14 h-14 transition-transform duration-300 ${
                isScanning ? "text-emerald-400 scale-110" : "text-blue-300/90"
              }`}
            />
          )}

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
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={onSimulateScan}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              Simulasi Scan ({demoCode})
            </button>
            <button
              type="button"
              onClick={() => setCameraOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
            >
              {cameraOpen ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  Tutup Kamera
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  Buka Kamera QR
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="rounded-xl bg-amber-500/20 border border-amber-400/40 px-3 py-2 text-[11px] text-amber-100">
          {cameraError}
        </div>
      )}
    </div>
  );
}
