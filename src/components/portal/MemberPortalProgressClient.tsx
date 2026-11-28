"use client";

import React, { useState } from "react";
import type { BodyMetric } from "@/types/database";
import { MemberProgressTracker } from "./MemberProgressTracker";

export function MemberPortalProgressClient({
  memberId,
  memberName,
  portalToken,
  initialMetrics,
}: {
  memberId: string;
  memberName: string;
  portalToken: string;
  initialMetrics: BodyMetric[];
}) {
  const [metrics, setMetrics] = useState<BodyMetric[]>(initialMetrics);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
          {errorMsg}
        </div>
      )}
      <MemberProgressTracker
        memberName={memberName}
        metrics={metrics}
        saving={saving}
        onSaveMetric={async (payload) => {
          setSaving(true);
          setErrorMsg(null);
          try {
            const res = await fetch("/api/body-metrics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                member_id: memberId,
                portal_token: portalToken,
                ...payload,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setErrorMsg(data.error || "Gagal menyimpan data BB");
              return;
            }
            if (data.metric) {
              setMetrics((prev) => {
                const idx = prev.findIndex(
                  (m) =>
                    m.id === data.metric.id ||
                    m.recorded_at === data.metric.recorded_at
                );
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = data.metric;
                  return next;
                }
                return [data.metric, ...prev];
              });
            }
          } catch {
            setErrorMsg("Terjadi kesalahan jaringan saat menyimpan BB.");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
