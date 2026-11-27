import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listBranches } from "@/lib/db/phase2b-service";
import { BranchesClient } from "@/components/branches/BranchesClient";

export default async function BranchesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return <BranchesClient initialBranches={listBranches()} />;
}
