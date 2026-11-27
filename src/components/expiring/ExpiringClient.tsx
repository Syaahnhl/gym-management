"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { GymSettings } from "@/types/database";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  buildWhatsAppUrl,
  formatDateId,
  formatDateTimeWib,
  renderReminderMessage,
} from "@/lib/domain/format";

type ExpiringMember = MemberWithStatus & { last_reminded_by_name: string | null };

export function ExpiringClient({
  members: initialMembers,
  settings,
}: {
  members: ExpiringMember[];
  settings: GymSettings;
}) {
  const [members, setMembers] = useState(initialMembers);

  async function handleRemind(m: ExpiringMember) {
    const message = renderReminderMessage(settings.reminder_template, {
      nama: m.full_name,
      tanggal_habis: formatDateId(m.status_info.end_date),
      sisa_hari: Math.max(0, m.status_info.remaining_days ?? 0),
      nama_gym: settings.name,
    });
    const url = buildWhatsAppUrl(m.phone, message);
    window.open(url, "_blank", "noopener,noreferrer");

    const res = await fetch(`/api/members/${m.id}/remind`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setMembers((prev) =>
        prev.map((x) =>
          x.id === m.id
            ? {
                ...x,
                last_reminded_at: data.member.last_reminded_at,
                last_reminded_by_name: "Baru saja",
              }
            : x
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Member Akan Habis & Pengingat WhatsApp
        </h1>
        <p className="text-sm text-slate-500">
          Menampilkan member yang habis dalam {settings.reminder_days} hari ke
          depan dan yang habis dalam 30 hari terakhir ({members.length} member)
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">No. HP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tanggal Habis</th>
              <th className="px-4 py-3">Terakhir Diingatkan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${m.id}`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {m.full_name}
                  </Link>
                  <div className="font-mono text-xs text-slate-500">
                    {m.member_code}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status_info.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatDateId(m.status_info.end_date)}
                  <div className="text-xs text-slate-500">
                    {(m.status_info.remaining_days ?? 0) >= 0
                      ? `Sisa ${m.status_info.remaining_days} hari`
                      : `Lewat ${Math.abs(m.status_info.remaining_days ?? 0)} hari`}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {m.last_reminded_at ? (
                    <>
                      <div>{formatDateTimeWib(m.last_reminded_at)}</div>
                      <div>oleh {m.last_reminded_by_name}</div>
                    </>
                  ) : (
                    "Belum pernah"
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => handleRemind(m)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Kirim WA
                  </button>
                  <Link
                    href={`/renew/${m.id}`}
                    className="inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Perpanjang
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
