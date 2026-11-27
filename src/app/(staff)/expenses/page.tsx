import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getGymSettings, listExpenses } from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

export default async function ExpensesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const settings = getGymSettings();
  const expenses = listExpenses(
    staff.role === "owner" ? undefined : staff.id
  );

  return (
    <ExpensesClient
      initialExpenses={expenses}
      staffRole={staff.role}
      canCashierRecord={settings.cashier_can_record_expense}
      todayStr={getJakartaTodayStr()}
    />
  );
}
