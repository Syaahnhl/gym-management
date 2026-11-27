import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { updateStaff } from "@/lib/db/service";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["owner", "cashier"]).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6).optional(),
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
    const staff = updateStaff(auth.staff.id, id, parsed.data);
    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui akun staff" },
      { status: 400 }
    );
  }
}
