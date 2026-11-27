"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Package, PaymentIntent } from "@/types/database";
import { formatRupiah } from "@/lib/domain/format";
import { QrCodeBox } from "@/components/ui/QrCodeBox";

export function PortalRenewalClient({
  token,
  packages,
}: {
  token: string;
  packages: Package[];
}) {
  const router = useRouter();
  const [pkgId, setPkgId] = useState(packages[0]?.id || "");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);

  async function createPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, packageId: pkgId }),
      });
      const d = await res.json();
      if (res.ok) setIntent(d.intent);
    } finally {
      setLoading(false);
    }
  }

  async function simulatePaid() {
    if (!intent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: intent.order_id }),
      });
      if (res.ok) {
        alert("Pembayaran berhasil! Masa aktif Anda otomatis diperpanjang.");
        setIntent(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-lg">
      <h2 className="text-sm font-bold text-slate-900">
        Perpanjang Mandiri (QRIS / Payment Gateway)
      </h2>
      {!intent ? (
        <div className="mt-3 space-y-3">
          <select
            value={pkgId}
            onChange={(e) => setPkgId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatRupiah(p.price)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={createPayment}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {loading ? "Membuat Tagihan..." : "Bayar Sekarang (QRIS)"}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col items-center space-y-3 text-center">
          <p className="font-mono text-xs text-slate-500">{intent.order_id}</p>
          <QrCodeBox value={intent.qr_string || intent.order_id} size={160} />
          <p className="text-base font-bold text-emerald-700">
            {formatRupiah(intent.amount)}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={simulatePaid}
            className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white"
          >
            Simulasikan Pembayaran Lunas (Webhook)
          </button>
        </div>
      )}
    </div>
  );
}
