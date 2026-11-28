"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { QrCodeBox } from "@/components/ui/QrCodeBox";

export function OutletQrCard({
  branchId,
  branchName,
  address,
  phone,
}: {
  branchId: string;
  branchName: string;
  address?: string;
  phone?: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const path = `/absen/${branchId}`;
  const fullUrl = origin ? `${origin}${path}` : path;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  async function handleDownload() {
    const dataUrl = await QRCode.toDataURL(fullUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `QR-Absensi-${branchName.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
          <QrCode className="h-3 w-3" />
          QR Absensi Outlet
        </div>
        <h2 className="text-base font-bold text-slate-900">{branchName}</h2>
        {address && <p className="text-xs text-slate-600">{address}</p>}
        {phone && <p className="text-xs text-slate-500">{phone}</p>}
        <p className="break-all pt-1 font-mono text-[11px] text-slate-400">
          {fullUrl}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh QR
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Salin Link
              </>
            )}
          </button>
          <Link
            href={path}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Buka
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center">
        <QrCodeBox value={fullUrl} size={132} />
        <span className="mt-1.5 text-[10px] font-medium text-slate-400">
          Scan untuk Absen &amp; Input BB
        </span>
      </div>
    </div>
  );
}
