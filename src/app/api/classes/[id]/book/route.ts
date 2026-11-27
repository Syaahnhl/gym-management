import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { bookClass } from "@/lib/db/phase2b-service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  try {
    const { id } = await context.params;
    const body = await req.json();
    const booking = bookClass(auth.staff.id, id, body.memberId);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal booking kelas" },
      { status: 400 }
    );
  }
}
