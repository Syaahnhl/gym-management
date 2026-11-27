import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listPromotions } from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { PromotionsClient } from "@/components/promotions/PromotionsClient";

export default async function PromotionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return (
    <PromotionsClient
      initialPromotions={listPromotions(false)}
      todayStr={getJakartaTodayStr()}
    />
  );
}
