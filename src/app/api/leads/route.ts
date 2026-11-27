import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import type { LeadStatus } from "@/types/database";

export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    full_name?: string;
    phone?: string;
    source?: string;
    interest_package?: string;
    notes?: string;
    trial_date?: string | null;
  };
  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: "Nama prospek wajib diisi" }, { status: 400 });
  }

  const db = readLocalDb();
  const lead = {
    id: `lead-${Date.now()}`,
    full_name: body.full_name.trim(),
    phone: body.phone?.trim() || "-",
    source: body.source || "Walk-in",
    interest_package: body.interest_package || "Paket Bulanan",
    status: "baru" as LeadStatus,
    notes: body.notes || null,
    trial_date: body.trial_date || null,
    created_at: new Date().toISOString(),
  };
  db.leads.unshift(lead);
  db.activity_logs.unshift({
    id: `act-${Date.now()}`,
    user_id: staff.id,
    action: "lead_created",
    entity_type: "lead",
    entity_id: lead.id,
    details: { full_name: lead.full_name },
    created_at: new Date().toISOString(),
  });
  writeLocalDb(db);
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { id?: string; status?: LeadStatus };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  const db = readLocalDb();
  db.leads = db.leads.map((l) => (l.id === body.id ? { ...l, status: body.status! } : l));
  writeLocalDb(db);
  return NextResponse.json({ ok: true });
}
