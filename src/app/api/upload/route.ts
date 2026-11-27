import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { uploadAssetToStorage } from "@/lib/supabase/db-adapter";

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const url = await uploadAssetToStorage(
      body.folder || "members",
      body.fileName || "photo.jpg",
      body.dataUrl
    );
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengunggah foto" },
      { status: 400 }
    );
  }
}
