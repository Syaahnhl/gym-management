import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listMembersWithStatus } from "@/lib/db/service";
import { listClasses, listTrainers } from "@/lib/db/phase2b-service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { ClassesClient } from "@/components/classes/ClassesClient";

export default async function ClassesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  return (
    <ClassesClient
      initialClasses={listClasses()}
      trainers={listTrainers(true)}
      members={listMembersWithStatus()
        .filter((m) => m.is_active)
        .map((m) => ({ id: m.id, full_name: m.full_name, member_code: m.member_code }))}
      staffRole={staff.role}
      todayStr={getJakartaTodayStr()}
    />
  );
}
