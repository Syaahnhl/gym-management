import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { CheckinsReportClient } from "@/components/reports/CheckinsReportClient";

export default async function CheckinsReportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const db = readLocalDb();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  const txMap = new Map(db.transactions.map((t) => [t.id, t]));

  const rows = [...db.checkins]
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
    .map((c) => {
      const m = c.member_id ? memberMap.get(c.member_id) : null;
      const tx = c.transaction_id ? txMap.get(c.transaction_id) : null;
      return {
        id: c.id,
        date: getJakartaTodayStr(new Date(c.checked_in_at)),
        checked_in_at: c.checked_in_at,
        name: m?.full_name || tx?.guest_name || "Pengunjung Harian",
        code: m?.member_code || "WALK-IN",
        method: c.method,
        is_duplicate: c.is_duplicate,
      };
    });

  return <CheckinsReportClient rows={rows} />;
}
