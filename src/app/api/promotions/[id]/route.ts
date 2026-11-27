import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { updatePromotion } from "@/lib/db/service";

const patchSchema = z.object({
  is_active: z.boolean().optional(),
  name: z.string().min(2).optional(),
  max_quota: z.number().int().min(1).nullable().optional(),
  end_date: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const promotion = updatePromotion(auth.staff.id, id, parsed.data);
    return NextResponse.json({ promotion });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui promo" },
      { status: 400 }
    );
  }
}
