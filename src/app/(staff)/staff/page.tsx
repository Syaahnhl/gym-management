import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listStaff } from "@/lib/db/service";
import { StaffClient } from "@/components/staff/StaffClient";

export default async function StaffPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return <StaffClient initialStaff={listStaff()} currentUserId={staff.id} />;
}
