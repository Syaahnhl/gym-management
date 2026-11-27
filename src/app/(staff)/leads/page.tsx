import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { LeadsClient } from "@/components/leads/LeadsClient";

export default async function LeadsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const db = readLocalDb();
  return <LeadsClient initialLeads={db.leads} />;
}
