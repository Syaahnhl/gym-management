import type { ComputedMemberStatus } from "@/types/database";
import { STATUS_LABELS } from "@/lib/domain/membership";

const STYLES: Record<ComputedMemberStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  expiring: "bg-amber-100 text-amber-800 border-amber-200",
  expired: "bg-rose-100 text-rose-800 border-rose-200",
  not_started: "bg-sky-100 text-sky-800 border-sky-200",
  frozen: "bg-cyan-100 text-cyan-800 border-cyan-200",
  inactive: "bg-slate-200 text-slate-700 border-slate-300",
};

export function StatusBadge({ status }: { status: ComputedMemberStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
