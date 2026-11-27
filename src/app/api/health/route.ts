import { NextResponse } from "next/server";
import { checkStorageMode } from "@/lib/supabase/db-adapter";

export async function GET() {
  const status = await checkStorageMode();
  return NextResponse.json({ ok: true, ...status });
}
