import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createPromotion, listPromotions } from "@/lib/db/service";

const createSchema = z.object({
  name: z.string().min(2, "Nama promo wajib diisi"),
  code: z.string().nullable().optional(),
  discount_type: z.enum(["percent", "nominal"]),
  discount_value: z.number().int().min(1),
  applies_to: z.enum(["all", "package", "product"]).default("all"),
  target_ids: z.array(z.string()).default([]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_quota: z.number().int().min(1).nullable().optional(),
  max_per_member: z.number().int().min(1).nullable().optional(),
  new_member_only: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  return NextResponse.json({ promotions: listPromotions(activeOnly) });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data promo tidak valid" },
        { status: 400 }
      );
    }
    const promotion = createPromotion(auth.staff.id, {
      ...parsed.data,
      code: parsed.data.code || null,
      max_quota: parsed.data.max_quota ?? null,
      max_per_member: parsed.data.max_per_member ?? null,
    });
    return NextResponse.json({ promotion }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat promo" },
      { status: 400 }
    );
  }
}
