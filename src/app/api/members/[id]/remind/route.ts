import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { markMemberReminded } from "@/lib/db/service";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const member = markMemberReminded(auth.staff.id, id);
    return NextResponse.json({ member });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mencatat pengingat" },
      { status: 400 }
    );
  }
}
