import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { ActivityLogClient } from "@/components/activity/ActivityLogClient";

export default async function ActivityLogPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const db = readLocalDb();
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));
  const logs = db.activity_logs.slice(0, 200).map((l) => ({
    ...l,
    actor_name: l.user_id ? userMap.get(l.user_id) || "Staff" : "Sistem",
  }));

  return <ActivityLogClient initialLogs={logs} />;
}
