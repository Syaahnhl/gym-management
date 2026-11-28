import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { getJakartaTodayStr } from "@/lib/domain/membership";

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
      (m) => m.id === body.member_id && m.portal_token === body.portal_token
    );
    authorized = Boolean(memberMatch);
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.member_id) {
    return NextResponse.json({ error: "Member wajib diisi" }, { status: 400 });
  }

  const memberExists = db.members.some((m) => m.id === body.member_id);
  if (!memberExists) {
    return NextResponse.json(
      { error: "Member tidak ditemukan" },
      { status: 404 }
    );
  }

  const weightKg = Number(body.weight_kg);
  const heightCm = Number(body.height_cm);
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    return NextResponse.json(
      { error: "Berat badan (kg) harus berupa angka yang valid (1–500 kg)" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
    return NextResponse.json(
      { error: "Tinggi badan (cm) harus berupa angka yang valid (1–300 cm)" },
      { status: 400 }
    );
  }

  const parseOpt = (v: number | null | undefined) => {
    if (v === null || v === undefined || v === ("" as unknown as number)) {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const todayWib = getJakartaTodayStr();
  const existingIdx = db.body_metrics.findIndex(
    (m) => m.member_id === body.member_id && m.recorded_at === todayWib
  );

  if (existingIdx >= 0) {
    const updatedMetric = {
      ...db.body_metrics[existingIdx],
      weight_kg: weightKg,
      height_cm: heightCm,
      body_fat_percent: parseOpt(body.body_fat_percent),
      muscle_mass_kg: parseOpt(body.muscle_mass_kg),
      waist_cm: parseOpt(body.waist_cm),
      notes: body.notes?.trim() || null,
    };
    db.body_metrics[existingIdx] = updatedMetric;
    writeLocalDb(db);
    return NextResponse.json({ metric: updatedMetric, updated: true });
  }

  const metric = {
    id: `bm-${Date.now()}`,
    member_id: body.member_id,
    recorded_at: todayWib,
    weight_kg: weightKg,
    height_cm: heightCm,
    body_fat_percent: parseOpt(body.body_fat_percent),
    muscle_mass_kg: parseOpt(body.muscle_mass_kg),
    waist_cm: parseOpt(body.waist_cm),
    notes: body.notes?.trim() || null,
  };
  db.body_metrics.unshift(metric);
  writeLocalDb(db);
  return NextResponse.json({ metric, updated: false }, { status: 201 });
}
