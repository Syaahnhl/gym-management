import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createTrainer, listTrainers, updateTrainer } from "@/lib/db/phase2b-service";

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  specialty: z.string().default(""),
  commission_type: z.enum(["percent", "fixed"]).default("percent"),
  commission_value: z.number().int().min(0),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ trainers: listTrainers(false) });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data trainer tidak valid" }, { status: 400 });
    }
    const trainer = createTrainer(auth.staff.id, {
      ...parsed.data,
      is_active: true,
    });
    return NextResponse.json({ trainer }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menambah trainer" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const trainer = updateTrainer(auth.staff.id, body.id, {
      is_active: body.is_active,
    });
    return NextResponse.json({ trainer });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update trainer" },
      { status: 400 }
    );
  }
}
