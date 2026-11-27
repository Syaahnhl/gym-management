import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listMembersWithStatus } from "@/lib/db/service";
import { MembersReportClient } from "@/components/reports/MembersReportClient";

export default async function MembersReportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const members = listMembersWithStatus();
  return <MembersReportClient members={members} />;
}
