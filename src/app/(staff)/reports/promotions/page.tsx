import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getPromotionsReport } from "@/lib/db/service";
import { PromotionsReportClient } from "@/components/reports/PromotionsReportClient";

export default async function PromotionsReportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return <PromotionsReportClient rows={getPromotionsReport()} />;
}
