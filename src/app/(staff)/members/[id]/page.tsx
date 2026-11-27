import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getGymSettings, getMemberById } from "@/lib/db/service";
import { MemberDetailClient } from "@/components/members/MemberDetailClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const { id } = await params;
  const member = getMemberById(id);
  if (!member) notFound();

  const db = readLocalDb();
  const memberships = db.memberships
    .filter((m) => m.member_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const transactions = db.transactions
    .filter((t) => t.member_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const checkins = db.checkins
    .filter((c) => c.member_id === id)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));
  const settings = getGymSettings();

  return (
    <MemberDetailClient
      initialMember={member}
      memberships={memberships}
      transactions={transactions}
      checkins={checkins}
      staffRole={staff.role}
      gymName={settings.name}
    />
  );
}
