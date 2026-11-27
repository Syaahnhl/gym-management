import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import {
  getOpenShiftForCashier,
  getShiftSummary,
  listShifts,
  openShift,
} from "@/lib/db/service";
import { readLocalDb } from "@/lib/db/local-store";

const openSchema = z.object({
  opening_cash: z.number().int().min(0, "Saldo awal tidak boleh negatif"),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const isOwner = auth.staff.role === "owner";
  const shifts = listShifts(isOwner ? undefined : auth.staff.id);
  const openShiftRow = getOpenShiftForCashier(auth.staff.id);
  const openSummary = openShiftRow ? getShiftSummary(openShiftRow.id) : null;
  const users = readLocalDb().users;
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    open_shift: openShiftRow,
    open_summary: openSummary,
    shifts: shifts.map((s) => ({
      ...s,
      cashier_name: userMap.get(s.cashier_id) || "Staff",
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = openSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    const shift = openShift(auth.staff.id, parsed.data.opening_cash);
    return NextResponse.json({ shift }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuka shift" },
      { status: 400 }
    );
  }
}
