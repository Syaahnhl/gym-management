import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getGymSettings } from "@/lib/db/service";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return <SettingsClient initialSettings={getGymSettings()} />;
}
