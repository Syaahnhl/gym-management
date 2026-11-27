import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import type { LockerStatus } from "@/types/database";

export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    id?: string;
    action?: "assign" | "release" | "maintenance";
    member_id?: string | null;
  };
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const db = readLocalDb();
  const member = body.member_id ? db.members.find((m) => m.id === body.member_id) : null;
  const nowIso = new Date().toISOString();

  db.lockers = db.lockers.map((l) => {
    if (l.id !== body.id) return l;
    if (body.action === "assign" && member) {
      return {
        ...l,
        status: "occupied" as LockerStatus,
        member_id: member.id,
        member_name: member.full_name,
        assigned_at: nowIso,
      };
    }
    if (body.action === "maintenance") {
      return {
        ...l,
        status: l.status === "maintenance" ? ("available" as LockerStatus) : ("maintenance" as LockerStatus),
        member_id: null,
        member_name: null,
        assigned_at: null,
      };
    }
    return {
      ...l,
      status: "available" as LockerStatus,
      member_id: null,
      member_name: null,
      assigned_at: null,
    };
  });

  db.activity_logs.unshift({
    id: `act-${Date.now()}`,
    user_id: staff.id,
    action: `locker_${body.action}`,
    entity_type: "locker",
    entity_id: body.id,
    details: { member: member?.full_name ?? null },
    created_at: nowIso,
  });
  writeLocalDb(db);
  return NextResponse.json({ lockers: db.lockers });
}
