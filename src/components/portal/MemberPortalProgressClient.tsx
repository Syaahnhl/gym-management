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

  return (
    <MemberProgressTracker
      memberName={memberName}
      metrics={metrics}
      saving={saving}
      onSaveMetric={async (payload) => {
        setSaving(true);
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
          if (res.ok) {
            const data = await res.json();
            if (data.metric) {
              setMetrics((prev) => [data.metric, ...prev]);
            }
          }
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
