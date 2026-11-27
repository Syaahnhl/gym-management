import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { getMemberById, updateMemberRecord } from "@/lib/db/service";

const patchSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  gender: z.enum(["L", "P"]).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  id_number: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const member = getMemberById(id);
  if (!member) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  const db = readLocalDb();
  const memberships = db.memberships
    .filter((m) => m.member_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const transactions = db.transactions
    .filter((t) => t.member_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const checkins = db.checkins
    .filter((c) => c.member_id === id)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));

  return NextResponse.json({ member, memberships, transactions, checkins });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }

    // FR-17: Hanya owner yang dapat menonaktifkan/mengaktifkan member
    if (
      parsed.data.is_active !== undefined &&
      auth.staff.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Hanya owner yang dapat menonaktifkan atau mengaktifkan member." },
        { status: 403 }
      );
    }

    const updated = updateMemberRecord(auth.staff.id, id, {
      ...parsed.data,
      email: parsed.data.email === "" ? null : parsed.data.email,
    });
    return NextResponse.json({ member: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui member" },
      { status: 400 }
    );
  }
}
