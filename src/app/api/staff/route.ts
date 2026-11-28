import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { createStaff, listStaff } from "@/lib/db/service";

const createSchema = z.object({
  name: z.string().min(2, "Nama staff wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["superadmin", "owner", "cashier"]),
});

export async function GET() {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;
  const all = listStaff();
  const visible =
    auth.staff.role === "superadmin"
      ? all
      : all.filter((u) => u.role !== "superadmin");
  return NextResponse.json({ staff: visible });
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
    if (parsed.data.role === "superadmin" && auth.staff.role !== "superadmin") {
      return NextResponse.json(
        { error: "Hanya Superadmin yang dapat membuat akun Superadmin." },
        { status: 403 }
      );
    }
    const staff = createStaff(auth.staff.id, parsed.data);
    return NextResponse.json({ staff }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat akun staff" },
      { status: 400 }
    );
  }
}
