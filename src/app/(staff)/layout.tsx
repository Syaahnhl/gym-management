import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getGymSettings, getOpenShiftForCashier } from "@/lib/db/service";
import { AppShell } from "@/components/layout/AppShell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/login");
  }

  const settings = getGymSettings();
  const openShift = getOpenShiftForCashier(staff.id);

  return (
    <AppShell staff={staff} settings={settings} openShift={openShift}>
      {children}
    </AppShell>
  );
}
