import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { RevenueReportClient } from "@/components/reports/RevenueReportClient";

export default async function RevenueReportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const db = readLocalDb();
  const pkgMap = new Map(db.packages.map((p) => [p.id, p.name]));
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));
  const memberMap = new Map(db.members.map((m) => [m.id, m.full_name]));

  const rows = db.transactions
    .filter((t) => t.status === "paid")
    .map((t) => ({
      id: t.id,
      invoice_number: t.invoice_number,
      date: getJakartaTodayStr(new Date(t.created_at)),
      created_at: t.created_at,
      type: t.type,
      customer: t.member_id
        ? memberMap.get(t.member_id) || "-"
        : t.guest_name || "Walk-in",
      package_name: pkgMap.get(t.package_id) || "-",
      payment_method: t.payment_method,
      cashier_name: userMap.get(t.cashier_id) || "-",
      total: t.total,
    }));

  return <RevenueReportClient rows={rows} />;
}
