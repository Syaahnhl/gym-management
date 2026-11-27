import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { validatePromotion } from "@/lib/db/service";

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const result = validatePromotion({
      promotionId: body.promotionId,
      promoCode: body.promoCode,
      isNewMember: Boolean(body.isNewMember),
      memberId: body.memberId,
      packageId: body.packageId,
      productIds: body.productIds,
      subtotal: Number(body.subtotal || 0),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Promo tidak berlaku" },
      { status: 400 }
    );
  }
}
