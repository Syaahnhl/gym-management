import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getProfitLossReport } from "@/lib/db/service";
import { ProfitLossClient } from "@/components/reports/ProfitLossClient";

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const { from, to } = await searchParams;
  const report = getProfitLossReport(from, to);

  return (
    <ProfitLossClient
      report={report}
      initialFrom={from || ""}
      initialTo={to || ""}
    />
  );
}
