import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import {
  getOpenShiftForCashier,
  getShiftSummary,
  listShifts,
} from "@/lib/db/service";
import { ShiftClient } from "@/components/shift/ShiftClient";

export default async function ShiftPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const openShift = getOpenShiftForCashier(staff.id);
  const openSummary = openShift ? getShiftSummary(openShift.id) : null;
  const shifts = listShifts(staff.role === "owner" ? undefined : staff.id);
  const users = readLocalDb().users;
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <ShiftClient
      openShift={openShift}
      openSummary={openSummary}
      shifts={shifts.map((s) => ({
        ...s,
        cashier_name: userMap.get(s.cashier_id) || "Staff",
      }))}
    />
  );
}
