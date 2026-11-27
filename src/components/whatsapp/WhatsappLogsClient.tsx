"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import type { WhatsappLog } from "@/types/database";
import { formatDateTimeWib } from "@/lib/domain/format";

export function WhatsappLogsClient({
  initialLogs,
}: {
  initialLogs: WhatsappLog[];
}) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [sending, setSending] = useState(false);

  async function triggerAutoReminders() {
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-reminders", {
        method: "POST",
      });
      const d = await res.json();
      if (res.ok) {
        setLogs((prev) => [...d.logs, ...prev]);
        alert(`Berhasil memproses ${d.sent_count} pengingat WhatsApp otomatis.`);
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            WhatsApp Otomatis & Log Pengiriman
          </h1>
          <p className="text-sm text-slate-500">
            Kirim pengingat massal otomatis ke member yang akan habis masa
            aktifnya
          </p>
        </div>
        <button
          type="button"
          disabled={sending}
          onClick={triggerAutoReminders}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Mengirim..." : "Kirim Pengingat Otomatis Sekarang"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">No. Tujuan</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Pesan</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(l.created_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{l.phone}</td>
                <td className="px-4 py-3 uppercase text-xs">{l.provider}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{l.message}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      l.status === "sent"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {l.status === "sent" ? "Terkirim" : "Gagal"}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Belum ada log pengiriman WhatsApp otomatis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
