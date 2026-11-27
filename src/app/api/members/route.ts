import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { listMembersWithStatus } from "@/lib/db/service";

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const statusFilter = req.nextUrl.searchParams.get("status") || "all";

  let members = listMembersWithStatus();

  if (q) {
    members = members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.member_code.toLowerCase().includes(q)
    );
  }

  if (statusFilter !== "all") {
    members = members.filter((m) => m.status_info.status === statusFilter);
  }

  return NextResponse.json({ members });
}
