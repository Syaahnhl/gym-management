import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentGatewayWebhook } from "@/lib/db/phase2b-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.order_id) {
      return NextResponse.json({ error: "order_id wajib diisi" }, { status: 400 });
    }
    const result = confirmPaymentGatewayWebhook(body.order_id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook gagal" },
      { status: 400 }
    );
  }
}
