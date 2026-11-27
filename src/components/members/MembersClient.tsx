"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateId } from "@/lib/domain/format";

export function MembersClient({
  initialMembers,
}: {
  initialMembers: MemberWithStatus[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialMembers.filter((m) => {
      const matchQuery =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.member_code.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || m.status_info.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [initialMembers, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Member</h1>
          <p className="text-sm text-slate-500">
            Total {initialMembers.length} member terdaftar
          </p>
        </div>
        <Link
          href="/members/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Member Baru
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, nomor HP, atau kode GYM-..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="expiring">Akan Habis</option>
          <option value="expired">Habis</option>
          <option value="not_started">Belum Mulai</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama Lengkap</th>
              <th className="px-4 py-3">No. HP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Masa Aktif s/d</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                  {m.member_code}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {m.full_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status_info.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateId(m.status_info.end_date)}
                  {m.status_info.remaining_days !== null &&
                    m.status_info.remaining_days >= 0 && (
                      <span className="ml-1.5 text-xs text-slate-400">
                        ({m.status_info.remaining_days} hari)
                      </span>
                    )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/members/${m.id}`}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Detail
                  </Link>
                  {m.is_active && (
                    <Link
                      href={`/renew/${m.id}`}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Perpanjang
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada member yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
