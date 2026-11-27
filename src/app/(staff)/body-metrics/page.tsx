import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { BodyMetricsClient } from "@/components/body-metrics/BodyMetricsClient";

export default async function BodyMetricsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const db = readLocalDb();
  return (
    <BodyMetricsClient
      initialMetrics={db.body_metrics}
      members={db.members.filter((m) => m.is_active).map((m) => ({ id: m.id, full_name: m.full_name, member_code: m.member_code, gender: m.gender }))}
    />
  );
}
