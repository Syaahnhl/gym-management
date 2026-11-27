"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Search, XCircle } from "lucide-react";
import type { ComputedMemberStatus } from "@/types/database";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateId, formatDateTimeWib } from "@/lib/domain/format";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<TodayCheckinRow[]>(initialCheckins);
  const scanRef = useRef<HTMLInputElement>(null);

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
    setSearchQuery("");
    scanRef.current?.focus();
  }

  useEffect(() => {
    if (!cameraOn) return;
    let scanner: { clear: () => Promise<void> } | null = null;
    let active = true;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!active) return;
      const instance = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      instance.render(
        (decodedText) => {
          submitCheckin({ query: decodedText, method: "qr" });
        },
        () => {}
      );
      scanner = instance;
    });

    return () => {
      active = false;
      scanner?.clear().catch(() => {});
    };
  }, [cameraOn]);

  const bannerColor = !result
    ? ""
    : !result.allowed
    ? "border-rose-300 bg-rose-50 text-rose-900"
    : result.member.status_info.status === "expiring"
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-emerald-300 bg-emerald-50 text-emerald-900";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check-in Member</h1>
        <p className="text-sm text-slate-500">
          Scan QR dengan scanner USB, kamera perangkat, atau cari nama/nomor HP
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel Scan & Cari */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
              Scan QR / Scanner USB (Ketik kode & Enter)
            </label>
            <div className="flex gap-2">
              <input
                ref={scanRef}
                autoFocus
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="GYM-00001 atau 0812..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Check-in
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                Kamera QR Scanner
              </span>
              <button
                type="button"
                onClick={() => setCameraOn(!cameraOn)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {cameraOn ? (
                  <>
                    <CameraOff className="h-4 w-4" /> Matikan Kamera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" /> Aktifkan Kamera
                  </>
                )}
              </button>
            </div>
            {cameraOn && <div id="qr-reader" className="mt-3 overflow-hidden rounded-xl" />}
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
            <div className={`rounded-2xl border-2 p-6 shadow-sm ${bannerColor}`}>
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
              Check-in Hari Ini ({checkins.length})
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
