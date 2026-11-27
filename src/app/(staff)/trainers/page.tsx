import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listMembersWithStatus } from "@/lib/db/service";
import { listPtSessions, listTrainers } from "@/lib/db/phase2b-service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { TrainersClient } from "@/components/trainers/TrainersClient";

export default async function TrainersPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const trainers = listTrainers(false);
  const sessions = listPtSessions();
  const members = listMembersWithStatus().filter((m) => m.is_active);

  return (
    <TrainersClient
      initialTrainers={trainers}
      initialSessions={sessions}
      members={members.map((m) => ({
        id: m.id,
        full_name: m.full_name,
        member_code: m.member_code,
      }))}
      staffRole={staff.role}
      todayStr={getJakartaTodayStr()}
    />
  );
}
