import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { finishFreezeEarly } from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const actualEndDate =
      typeof body.actualEndDate === "string" && body.actualEndDate
        ? body.actualEndDate
        : getJakartaTodayStr();
    const freeze = finishFreezeEarly(auth.staff, id, actualEndDate);
    return NextResponse.json({ freeze });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengakhiri freeze" },
      { status: 400 }
    );
  }
}
