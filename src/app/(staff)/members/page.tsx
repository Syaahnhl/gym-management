import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listMembersWithStatus } from "@/lib/db/service";
import { MembersClient } from "@/components/members/MembersClient";

export default async function MembersPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const members = listMembersWithStatus();
  return <MembersClient initialMembers={members} />;
}
