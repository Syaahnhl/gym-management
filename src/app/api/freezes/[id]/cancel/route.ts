import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { cancelFreeze } from "@/lib/db/service";

const schema = z.object({
  reason: z.string().min(3, "Alasan pembatalan wajib diisi"),
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Alasan wajib diisi" },
        { status: 400 }
      );
    }
    const freeze = cancelFreeze(auth.staff, id, parsed.data.reason);
    return NextResponse.json({ freeze });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membatalkan freeze" },
      { status: 400 }
    );
  }
}
