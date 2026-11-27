import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listFreezes, listMembersWithStatus } from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { FreezesClient } from "@/components/freezes/FreezesClient";

export default async function FreezesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const freezes = listFreezes();
  const activeMembers = listMembersWithStatus().filter(
    (m) =>
      m.is_active &&
      (m.status_info.status === "active" || m.status_info.status === "expiring")
  );

  return (
    <FreezesClient
      initialFreezes={freezes}
      activeMembers={activeMembers.map((m) => ({
        id: m.id,
        member_code: m.member_code,
        full_name: m.full_name,
      }))}
      staffRole={staff.role}
      todayStr={getJakartaTodayStr()}
    />
  );
}
