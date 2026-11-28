import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readLocalDb } from "@/lib/db/local-store";
import type { SafeStaffUser, StaffRole, StaffUser } from "@/types/database";

const SESSION_COOKIE = "gym_session";

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "ironpeak-gym-mvp-dev-secret-change-in-production-32chars"
  );
}

interface SessionPayload {
  userId: string;
  role: StaffRole;
  exp: number;
}

export function signSessionToken(user: Pick<StaffUser, "id" | "role">): string {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 hari
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function toSafeStaff(user: StaffUser): SafeStaffUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}

export async function getCurrentStaff(): Promise<SafeStaffUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === payload.userId);
  // FR-03: Akun yang dinonaktifkan tidak bisa login / akses
  if (!user || !user.is_active) return null;

  return toSafeStaff(user);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Helper RBAC untuk API Routes (FR-04).
 */
export async function requireApiStaff(
  allowedRoles?: StaffRole[]
): Promise<{ staff: SafeStaffUser } | { error: NextResponse }> {
  const staff = await getCurrentStaff();
  if (!staff) {
    return {
      error: NextResponse.json(
        { error: "Sesi login tidak valid atau sudah berakhir. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }

  if (
    allowedRoles &&
    staff.role !== "superadmin" &&
    !allowedRoles.includes(staff.role)
  ) {
    return {
      error: NextResponse.json(
        { error: "Anda tidak memiliki izin untuk mengakses fitur ini." },
        { status: 403 }
      ),
    };
  }

  return { staff };
}
