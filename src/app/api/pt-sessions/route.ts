import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import {
  createPtSession,
  listPtSessions,
  updatePtSessionStatus,
} from "@/lib/db/phase2b-service";

const createSchema = z.object({
  memberId: z.string().min(1),
  trainerId: z.string().min(1),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionTime: z.string().min(4),
  sessionFee: z.number().int().min(0),
  notes: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ sessions: listPtSessions() });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data sesi PT tidak valid" }, { status: 400 });
    }
    const session = createPtSession(auth.staff, parsed.data);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat sesi PT" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const session = updatePtSessionStatus(auth.staff, body.id, body.status);
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update sesi PT" },
      { status: 400 }
    );
  }
}
