import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { voidExpense } from "@/lib/db/service";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const expense = voidExpense(auth.staff, id);
    return NextResponse.json({ expense });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membatalkan pengeluaran" },
      { status: 400 }
    );
  }
}
