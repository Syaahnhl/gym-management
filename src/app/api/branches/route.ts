import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { createBranch, listBranches } from "@/lib/db/phase2b-service";

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ branches: listBranches() });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const branch = createBranch(auth.staff.id, {
      name: body.name || "",
      address: body.address || "",
      phone: body.phone || "",
    });
    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menambah cabang" },
      { status: 400 }
    );
  }
}
