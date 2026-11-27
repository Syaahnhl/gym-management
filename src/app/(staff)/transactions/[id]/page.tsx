import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { ReceiptClient } from "@/components/transactions/ReceiptClient";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const { id } = await params;
  const db = readLocalDb();
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) notFound();
  if (staff.role === "cashier" && tx.cashier_id !== staff.id) {
    redirect("/transactions");
  }

  const member = tx.member_id
    ? db.members.find((m) => m.id === tx.member_id) || null
    : null;
  const pkg = db.packages.find((p) => p.id === tx.package_id) || null;
  const membership = db.memberships.find((m) => m.transaction_id === tx.id) || null;
  const cashier = db.users.find((u) => u.id === tx.cashier_id) || null;

  return (
    <ReceiptClient
      transaction={tx}
      member={member}
      pkg={pkg}
      membership={membership}
      cashierName={cashier?.name || "-"}
      settings={db.gym_settings}
      staffRole={staff.role}
    />
  );
}
