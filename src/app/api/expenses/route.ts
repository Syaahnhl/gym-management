import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createExpense, listExpenses } from "@/lib/db/service";

const createSchema = z.object({
  category: z.enum([
    "gaji",
    "listrik",
    "air",
    "sewa",
    "perawatan",
    "kebersihan",
    "marketing",
    "lainnya",
  ]),
  amount: z.number().int().min(1, "Nominal harus lebih dari 0"),
  paymentMethod: z.enum(["cash", "qris", "transfer", "card"]),
  date: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  const expenses = listExpenses(
    auth.staff.role === "owner" ? undefined : auth.staff.id
  );
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data pengeluaran tidak valid" },
        { status: 400 }
      );
    }
    const expense = createExpense(auth.staff, parsed.data);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mencatat pengeluaran" },
      { status: 400 }
    );
  }
}
