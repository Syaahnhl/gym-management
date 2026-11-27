import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = readLocalDb();
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }
  if (auth.staff.role === "cashier" && tx.cashier_id !== auth.staff.id) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const member = tx.member_id
    ? db.members.find((m) => m.id === tx.member_id) || null
    : null;
  const pkg = db.packages.find((p) => p.id === tx.package_id) || null;
  const membership = db.memberships.find((m) => m.transaction_id === tx.id) || null;
  const cashier = db.users.find((u) => u.id === tx.cashier_id) || null;

  return NextResponse.json({
    transaction: tx,
    member,
    package: pkg,
    membership,
    cashier_name: cashier?.name || "-",
    settings: db.gym_settings,
  });
}
