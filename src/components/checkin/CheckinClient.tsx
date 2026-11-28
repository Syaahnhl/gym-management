"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QrCode, Camera, CameraOff, CheckCircle2, Search, XCircle } from "lucide-react";
import type { ComputedMemberStatus } from "@/types/database";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrCodeBox } from "@/components/ui/QrCodeBox";
import { formatDateId, formatDateTimeWib } from "@/lib/domain/format";
import { QrScanAnimationBox } from "@/components/checkin/QrScanAnimationBox";

interface QuickMember {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  status: ComputedMemberStatus;
}

interface TodayCheckinRow {
  id: string;
  name: string;
  code: string;
  checked_in_at: string;
  method: string;
  is_duplicate: boolean;
}

interface CheckinResult {
  member: MemberWithStatus;
  allowed: boolean;
  is_duplicate: boolean;
  message: string;
}

export function CheckinClient({
  members,
  initialCheckins,
}: {
  members: QuickMember[];
  initialCheckins: TodayCheckinRow[];
}) {
  const [scanInput, setScanInput] = useState("");
  const [manualIdInput, setManualIdInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<TodayCheckinRow[]>(initialCheckins);
  const [isScanAnimating, setIsScanAnimating] = useState(false);
  const [showGymQr, setShowGymQr] = useState(true);
  const scanRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [members, searchQuery]);

  async function submitCheckin(payload: {
    query?: string;
    member_id?: string;
    method: "qr" | "search";
  }) {
    setError(null);
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Member tidak ditemukan");
      setResult(null);
      return;
    }
    setResult(data);
    if (data.allowed && data.checkin) {
      setIsScanAnimating(true);
      setTimeout(() => setIsScanAnimating(false), 1200);
      setCheckins((prev) => [
        {
          id: data.checkin.id,
          name: data.member.full_name,
          code: data.member.member_code,
          checked_in_at: data.checkin.checked_in_at,
          method: data.checkin.method,
          is_duplicate: data.is_duplicate,
        },
        ...prev,
      ]);
    }
    setScanInput("");
    setManualIdInput("");
    setSearchQuery("");
    scanRef.current?.focus();
  }

  useEffect(() => {
    if (!cameraOn) {
      setCameraError(null);
      return;
    }

    let active = true;
    let qrInstance: {
      stop: () => Promise<void>;
      clear: () => void;
    } | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!active) return;

        const qr = new Html5Qrcode("qr-reader");
        qrInstance = qr;

        const onDecoded = (decodedText: string) => {
          const now = Date.now();
          if (
            lastScanRef.current.code === decodedText &&
            now - lastScanRef.current.at < 3000
          ) {
            return;
          }
          lastScanRef.current = { code: decodedText, at: now };
          submitCheckin({ query: decodedText, method: "qr" });
        };

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };
        try {
          await qr.start({ facingMode: "environment" }, config, onDecoded, () => {});
        } catch {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) {
            throw new Error("Kamera tidak ditemukan pada perangkat ini.");
          }
          await qr.start(cameras[0].id, config, onDecoded, () => {});
        }
      } catch (err) {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal membuka kamera. Pastikan izin kamera diizinkan oleh browser.";
        setCameraError(msg);
        setCameraOn(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (qrInstance) {
        qrInstance
          .stop()
          .then(() => qrInstance?.clear())
          .catch(() => {});
      }
    };
  }, [cameraOn]);

  const bannerColor = !result
    ? ""
    : !result.allowed
    ? "border-rose-300 bg-rose-50 text-rose-900"
    : result.member.status_info.status === "expiring"
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-blue-300 bg-blue-50 text-blue-900";

  const uniqueTodayCount = new Set(
    checkins.filter((c) => !c.is_duplicate).map((c) => c.code)
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Presensi Member (QR & ID Manual)
          </h1>
          <p className="text-sm text-slate-500">
            Scan QR Code member atau masukkan ID Member manual jika QR bermasalah
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
          Hadir Hari Ini: <strong>{uniqueTodayCount} member</strong> ({checkins.length} total scan)
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {/* Top bar: Tampilkan QR untuk Presensi & Buka Kamera Scan QR Absensi */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  QR Check-in Gym & Scanner Absensi
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowGymQr((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  {showGymQr ? "Sembunyikan QR Gym" : "Tampilkan QR untuk Presensi"}
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOn((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition ${
                    cameraOn ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {cameraOn ? (
                    <>
                      <CameraOff className="h-3.5 w-3.5" /> Tutup Kamera
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" /> Buka Kamera Scan QR Absensi
                    </>
                  )}
                </button>
              </div>
            </div>

            {showGymQr && (
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shrink-0">
                  <QrCodeBox value="GYMMATE-CHECKIN-GYM" size={128} />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                    QR Check-in Gym (Scan dari HP Member)
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    Tunjukkan QR ini di meja kasir
                  </p>
                  <p className="text-xs text-slate-600">
                    Member scan QR ini dari Portal Member, lalu input ID Unik & Berat/Tinggi Badan secara mandiri.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <QrScanAnimationBox
              isScanning={isScanAnimating}
              demoCode={members[0]?.member_code || "GYM-00001"}
              onDetectedCode={(code) => {
                setScanInput(code);
                submitCheckin({ query: code, method: "qr" });
              }}
              onSimulateScan={() => {
                const target =
                  members.find((m) => m.status === "active") || members[0];
                if (target) {
                  submitCheckin({ query: target.member_code, method: "qr" });
                }
              }}
            />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (scanInput.trim()) {
                submitCheckin({ query: scanInput.trim(), method: "qr" });
              }
            }}
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-slate-800">
              1. Scan QR Code (Scanner USB)
            </label>
            <div className="flex gap-2">
              <input
                ref={scanRef}
                autoFocus
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Arahkan scanner QR (cth: GYM-00001)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Scan QR
              </button>
            </div>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualIdInput.trim()) {
                submitCheckin({ query: manualIdInput.trim(), method: "search" });
              }
            }}
            className="space-y-2 border-t border-slate-100 pt-4"
          >
            <label className="block text-sm font-semibold text-slate-800">
              2. Presensi Manual pakai ID Member (Jika QR Tidak Bisa)
            </label>
            <div className="flex gap-2">
              <input
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                placeholder="Ketik ID: GYM-00001 atau cukup angka 1"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Presensi ID
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                3. Kamera QR Scanner
              </span>
              <button
                type="button"
                onClick={() => setCameraOn(!cameraOn)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  cameraOn
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {cameraOn ? (
                  <>
                    <CameraOff className="h-4 w-4" /> Matikan Kamera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" /> Buka Kamera Scan QR
                  </>
                )}
              </button>
            </div>
            {cameraError && (
              <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {cameraError}
              </p>
            )}
            {cameraOn && (
              <div className="relative mt-3 overflow-hidden rounded-xl border-2 border-blue-400 bg-slate-950">
                <div id="qr-reader" className="w-full" />
                <div className="pointer-events-none absolute inset-0">
                  <div className="animate-qr-scan absolute inset-x-4 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.85)]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-semibold text-slate-800">
              Cari Manual (Nama / No. HP / Kode)
            </label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama member..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      submitCheckin({ member_id: m.id, method: "search" })
                    }
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-white"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {m.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.member_code} · {m.phone}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Panel Hasil Scan */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-900">
              <div className="flex items-center gap-2 font-bold">
                <XCircle className="h-5 w-5" />
                {error}
              </div>
            </div>
          )}

          {result && (
            <div
              className={`animate-scan-pop rounded-2xl border-2 p-6 shadow-sm ${bannerColor}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {result.allowed ? (
                    <CheckCircle2 className="h-8 w-8 shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">
                      {result.member.full_name}
                    </h2>
                    <p className="font-mono text-xs opacity-80">
                      {result.member.member_code}
                    </p>
                  </div>
                </div>
                <StatusBadge status={result.member.status_info.status} />
              </div>

              <p className="mt-4 text-sm font-semibold">{result.message}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  Tanggal Habis:{" "}
                  <strong>
                    {formatDateId(result.member.status_info.end_date)}
                  </strong>
                </div>
                <div>
                  Sisa Hari:{" "}
                  <strong>
                    {result.member.status_info.remaining_days !== null
                      ? `${result.member.status_info.remaining_days} hari`
                      : "-"}
                  </strong>
                </div>
              </div>

              {!result.allowed && result.member.is_active && (
                <Link
                  href={`/renew/${result.member.id}`}
                  className="mt-4 inline-block rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
                >
                  Perpanjang Sekarang
                </Link>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Log Absensi Harian ({checkins.length})
            </h3>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.code} · {formatDateTimeWib(c.checked_in_at)}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-slate-500">
                    {c.method}
                    {c.is_duplicate ? " (Duplikat)" : ""}
                  </span>
                </div>
              ))}
              {checkins.length === 0 && (
                <p className="text-slate-500">Belum ada check-in hari ini.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
