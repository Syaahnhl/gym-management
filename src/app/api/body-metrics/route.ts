import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";

export async function GET(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("member_id");
  const db = readLocalDb();
  const metrics = memberId
    ? db.body_metrics.filter((m) => m.member_id === memberId)
    : db.body_metrics;

  return NextResponse.json({ metrics });
}

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  const body = (await req.json()) as {
    member_id?: string;
    portal_token?: string;
    weight_kg?: number;
    height_cm?: number;
    body_fat_percent?: number | null;
    muscle_mass_kg?: number | null;
    waist_cm?: number | null;
    notes?: string | null;
  };

  const db = readLocalDb();
  let authorized = Boolean(staff);

  if (!authorized && body.portal_token && body.member_id) {
    const memberMatch = db.members.find(
      (m) => m.id === body.member_id && m.portal_token === body.portal_token,
    );
    authorized = Boolean(memberMatch);
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.member_id || !body.weight_kg || !body.height_cm) {
    return NextResponse.json(
      { error: "Member, berat & tinggi wajib diisi" },
      { status: 400 },
    );
  }

  const metric = {
    id: `bm-${Date.now()}`,
    member_id: body.member_id,
    recorded_at: new Date().toISOString().slice(0, 10),
    weight_kg: Number(body.weight_kg),
    height_cm: Number(body.height_cm),
    body_fat_percent: body.body_fat_percent ? Number(body.body_fat_percent) : null,
    muscle_mass_kg: body.muscle_mass_kg ? Number(body.muscle_mass_kg) : null,
    waist_cm: body.waist_cm ? Number(body.waist_cm) : null,
    notes: body.notes || null,
  };
  db.body_metrics.unshift(metric);
  writeLocalDb(db);
  return NextResponse.json({ metric });
}
