import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createClassSchedule, listClasses } from "@/lib/db/phase2b-service";

const createSchema = z.object({
  title: z.string().min(2),
  trainer_id: z.string().nullable().optional(),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().min(4),
  end_time: z.string().min(4),
  max_capacity: z.number().int().min(1),
  fee_per_session: z.number().int().min(0).default(0),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ classes: listClasses() });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data kelas tidak valid" }, { status: 400 });
    }
    const cls = createClassSchedule(auth.staff.id, {
      ...parsed.data,
      trainer_id: parsed.data.trainer_id || null,
      is_active: true,
    });
    return NextResponse.json({ class: cls }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat kelas" },
      { status: 400 }
    );
  }
}
