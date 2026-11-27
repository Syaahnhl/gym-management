import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { updateProduct } from "@/lib/db/service";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.enum(["minuman", "suplemen", "merchandise", "sewa"]).optional(),
  sku: z.string().nullable().optional(),
  sell_price: z.number().int().min(0).optional(),
  cost_price: z.number().int().min(0).optional(),
  min_stock: z.number().int().min(0).optional(),
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
        { error: parsed.error.issues[0]?.message || "Data produk tidak valid" },
        { status: 400 }
      );
    }
    const product = updateProduct(auth.staff.id, id, parsed.data);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui produk" },
      { status: 400 }
    );
  }
}
