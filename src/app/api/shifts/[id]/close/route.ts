import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { closeShift } from "@/lib/db/service";

const closeSchema = z.object({
  actual_cash: z.number().int().min(0, "Kas aktual tidak boleh negatif"),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = closeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    const shift = closeShift(
      auth.staff.id,
      id,
      parsed.data.actual_cash,
      parsed.data.notes
    );
    return NextResponse.json({ shift });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menutup shift" },
      { status: 400 }
    );
  }
}
