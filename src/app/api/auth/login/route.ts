import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateStaff } from "@/lib/db/service";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const staff = authenticateStaff(parsed.data.email, parsed.data.password);
    if (!staff) {
      return NextResponse.json(
        { error: "Email atau password salah, atau akun Anda telah dinonaktifkan." },
        { status: 401 }
      );
    }

    const token = signSessionToken({ id: staff.id, role: staff.role });
    await setSessionCookie(token);

    return NextResponse.json({ user: staff });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses login." },
      { status: 500 }
    );
  }
}
