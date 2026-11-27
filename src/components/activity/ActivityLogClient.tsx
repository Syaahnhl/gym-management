"use client";

import { useState } from "react";
import type { ActivityLog } from "@/types/database";
import { formatDateTimeWib } from "@/lib/domain/format";

type LogRow = ActivityLog & { actor_name: string };

export function ActivityLogClient({ initialLogs }: { initialLogs: LogRow[] }) {
  const [filter, setFilter] = useState("all");

  const actions = Array.from(new Set(initialLogs.map((l) => l.action)));
  const filtered =
    filter === "all"
      ? initialLogs
      : initialLogs.filter((l) => l.action === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log Aktivitas</h1>
          <p className="text-sm text-slate-500">
            Catatan audit aktivitas penting sistem (khusus Owner)
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Semua Aktivitas</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu (WIB)</th>
              <th className="px-4 py-3">Pelaku</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Entitas</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(log.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {log.actor_name}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{log.entity_type}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
