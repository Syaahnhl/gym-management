import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getGymSettings, listMembersWithStatus } from "@/lib/db/service";
import { ExpiringClient } from "@/components/expiring/ExpiringClient";

export default async function ExpiringPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const settings = getGymSettings();
  const members = listMembersWithStatus();
  const users = readLocalDb().users;
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // FR-43: member yang tanggal habisnya dalam N hari ke depan ATAU habis dalam 30 hari terakhir
  const list = members
    .filter((m) => {
      if (!m.is_active) return false;
      const rem = m.status_info.remaining_days;
      if (rem === null) return false;
      return rem <= settings.reminder_days && rem >= -30;
    })
    .sort(
      (a, b) =>
        (a.status_info.remaining_days ?? 999) -
        (b.status_info.remaining_days ?? 999)
    )
    .map((m) => ({
      ...m,
      last_reminded_by_name: m.last_reminded_by
        ? userMap.get(m.last_reminded_by) || "Staff"
        : null,
    }));

  return <ExpiringClient members={list} settings={settings} />;
}
