import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { listStockMovements, recordStockMovement } from "@/lib/db/service";

const schema = z.object({
  productId: z.string().min(1),
  type: z.enum(["in", "adjustment"]),
  qty: z.number().int(),
  reason: z.string().min(2, "Alasan wajib diisi"),
});

export async function GET() {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ movements: listStockMovements() });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input stok tidak valid" },
        { status: 400 }
      );
    }
    const product = recordStockMovement(auth.staff, parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mencatat mutasi stok" },
      { status: 400 }
    );
  }
}
