import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentStaff();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
