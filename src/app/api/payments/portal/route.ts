import { NextRequest, NextResponse } from "next/server";
import { getMemberByPortalToken } from "@/lib/db/service";
import { createSelfServicePaymentIntent } from "@/lib/db/phase2b-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const member = getMemberByPortalToken(body.token || "");
    if (!member) {
      return NextResponse.json({ error: "Token portal tidak valid" }, { status: 404 });
    }
    const intent = createSelfServicePaymentIntent({
      memberId: member.id,
      packageId: body.packageId,
    });
    return NextResponse.json({ intent }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat pembayaran" },
      { status: 400 }
    );
  }
}
