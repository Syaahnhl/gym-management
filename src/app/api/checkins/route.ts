import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getMemberByCodeOrPhone, getMemberById, recordMemberCheckin } from "@/lib/db/service";
import { triggerTurnstileGate } from "@/lib/db/phase2b-service";
import { getJakartaTodayStr } from "@/lib/domain/membership";

const checkinSchema = z.object({
  query: z.string().optional(),
  member_id: z.string().optional(),
  method: z.enum(["qr", "search"]).default("search"),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const db = readLocalDb();
  const todayStr = getJakartaTodayStr();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  const txMap = new Map(db.transactions.map((t) => [t.id, t]));

  const todayCheckins = db.checkins
    .filter((c) => getJakartaTodayStr(new Date(c.checked_in_at)) === todayStr)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
    .map((c) => {
      const m = c.member_id ? memberMap.get(c.member_id) : null;
      const tx = c.transaction_id ? txMap.get(c.transaction_id) : null;
      return {
        ...c,
        name: m?.full_name || tx?.guest_name || "Pengunjung Harian",
        code: m?.member_code || "WALK-IN",
      };
    });

  return NextResponse.json({ checkins: todayCheckins });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Input check-in tidak valid" }, { status: 400 });
    }

    let member = null;
    if (parsed.data.member_id) {
      member = getMemberById(parsed.data.member_id);
    } else if (parsed.data.query) {
      member = getMemberByCodeOrPhone(parsed.data.query);
    }

    if (!member) {
      return NextResponse.json(
        { error: "Member dengan kode atau nomor HP tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const result = recordMemberCheckin(auth.staff, member.id, parsed.data.method);
    const turnstile = result.allowed
      ? await triggerTurnstileGate(member.member_code)
      : null;
    return NextResponse.json({ ...result, turnstile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses check-in" },
      { status: 400 }
    );
  }
}
