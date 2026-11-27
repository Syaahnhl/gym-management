import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listPackages } from "@/lib/db/service";
import { PackagesClient } from "@/components/packages/PackagesClient";

export default async function PackagesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const packages = listPackages(false);
  return <PackagesClient initialPackages={packages} />;
}
