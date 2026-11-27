import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { updatePackage } from "@/lib/db/service";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(["membership", "daily"]).optional(),
  duration_days: z.number().int().min(1).optional(),
  price: z.number().int().min(0).optional(),
  registration_fee: z.number().int().min(0).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    const pkg = updatePackage(auth.staff.id, id, parsed.data);
    return NextResponse.json({ package: pkg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui paket" },
      { status: 400 }
    );
  }
}
