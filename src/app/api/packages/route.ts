import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createPackage, listPackages } from "@/lib/db/service";

const createSchema = z.object({
  name: z.string().min(2, "Nama paket wajib diisi"),
  type: z.enum(["membership", "daily"]),
  duration_days: z.number().int().min(1, "Durasi minimal 1 hari"),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  registration_fee: z.number().int().min(0).default(0),
  description: z.string().default(""),
  is_active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  return NextResponse.json({ packages: listPackages(activeOnly) });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    const pkg = createPackage(auth.staff.id, parsed.data);
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat paket" },
      { status: 400 }
    );
  }
}
