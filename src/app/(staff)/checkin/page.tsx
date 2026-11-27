import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { listMembersWithStatus } from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { CheckinClient } from "@/components/checkin/CheckinClient";

export default async function CheckinPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const members = listMembersWithStatus();
  const db = readLocalDb();
  const todayStr = getJakartaTodayStr();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  const txMap = new Map(db.transactions.map((t) => [t.id, t]));

  const todayCheckins = db.checkins
    .filter((c) => getJakartaTodayStr(new Date(c.checked_in_at)) === todayStr)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
    .map((c) => {
      const m = c.member_id ? memberMap.get(c.member_id) : null;
      const tx = c.transaction_id ? txMap.get(c.transaction_id) : null;
      return {
        ...c,
        name: m?.full_name || tx?.guest_name || "Pengunjung Harian",
        code: m?.member_code || "WALK-IN",
      };
    });

  return (
    <CheckinClient
      members={members.map((m) => ({
        id: m.id,
        member_code: m.member_code,
        full_name: m.full_name,
        phone: m.phone,
        status: m.status_info.status,
      }))}
      initialCheckins={todayCheckins}
    />
  );
}
