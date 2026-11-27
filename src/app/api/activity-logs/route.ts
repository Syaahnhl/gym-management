import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  const actionFilter = req.nextUrl.searchParams.get("action") || "all";
  const db = readLocalDb();
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));

  let logs = db.activity_logs;
  if (actionFilter !== "all") {
    logs = logs.filter((l) => l.action === actionFilter);
  }

  return NextResponse.json({
    logs: logs.slice(0, 200).map((l) => ({
      ...l,
      actor_name: l.user_id ? userMap.get(l.user_id) || "Staff" : "Sistem",
    })),
  });
}
