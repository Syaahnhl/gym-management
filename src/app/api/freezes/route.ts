import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { listFreezes, requestFreeze } from "@/lib/db/service";

const createSchema = z.object({
  memberId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.enum(["sakit", "dinas", "lainnya"]),
  reasonNotes: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ freezes: listFreezes() });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data freeze tidak valid" },
        { status: 400 }
      );
    }
    const freeze = requestFreeze(auth.staff, parsed.data);
    return NextResponse.json({ freeze }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengajukan freeze" },
      { status: 400 }
    );
  }
}
