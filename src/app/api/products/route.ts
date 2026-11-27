import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createProduct, listProducts } from "@/lib/db/service";

const createSchema = z.object({
  name: z.string().min(2, "Nama produk wajib diisi"),
  category: z.enum(["minuman", "suplemen", "merchandise", "sewa"]),
  sku: z.string().nullable().optional(),
  sell_price: z.number().int().min(0),
  cost_price: z.number().int().min(0),
  stock: z.number().int().min(0),
  min_stock: z.number().int().min(0),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  return NextResponse.json({ products: listProducts(activeOnly) });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data produk tidak valid" },
        { status: 400 }
      );
    }
    const product = createProduct(auth.staff.id, parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menambah produk" },
      { status: 400 }
    );
  }
}
