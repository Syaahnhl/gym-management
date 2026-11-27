import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { LockersClient } from "@/components/lockers/LockersClient";

export default async function LockersPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const db = readLocalDb();
  return (
    <LockersClient
      initialLockers={db.lockers}
      members={db.members.filter((m) => m.is_active).map((m) => ({ id: m.id, full_name: m.full_name, member_code: m.member_code }))}
    />
  );
}
