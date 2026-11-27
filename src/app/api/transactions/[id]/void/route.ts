import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { voidTransaction } from "@/lib/db/service";

const voidSchema = z.object({
  reason: z.string().min(3, "Alasan void minimal 3 karakter"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = voidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Alasan void wajib diisi" },
        { status: 400 }
      );
    }
    const tx = voidTransaction(auth.staff, id, parsed.data.reason);
    return NextResponse.json({ transaction: tx });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal void transaksi" },
      { status: 400 }
    );
  }
}
