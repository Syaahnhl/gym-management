import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import {
  processDailyTicketTransaction,
  processRegistrationTransaction,
  processRenewalTransaction,
} from "@/lib/db/service";

const registrationSchema = z.object({
  type: z.literal("registration"),
  memberData: z.object({
    full_name: z.string().min(2, "Nama lengkap wajib diisi"),
    phone: z.string().min(8, "Nomor HP minimal 8 digit"),
    email: z.string().email().nullable().optional().or(z.literal("")),
    gender: z.enum(["L", "P"]).nullable().optional(),
    birth_date: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    id_number: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    emergency_contact: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  packageId: z.string().min(1),
  startDate: z.string().optional(),
  discount: z.number().int().min(0).default(0),
  discountReason: z.string().optional(),
  paymentMethod: z.enum(["cash", "qris", "transfer", "card"]),
  cashReceived: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const renewalSchema = z.object({
  type: z.literal("renewal"),
  memberId: z.string().min(1),
  packageId: z.string().min(1),
  discount: z.number().int().min(0).default(0),
  discountReason: z.string().optional(),
  paymentMethod: z.enum(["cash", "qris", "transfer", "card"]),
  cashReceived: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const dailySchema = z.object({
  type: z.literal("daily"),
  guestName: z.string().min(2, "Nama pengunjung wajib diisi"),
  guestPhone: z.string().min(8, "Nomor HP pengunjung wajib diisi"),
  packageId: z.string().min(1),
  discount: z.number().int().min(0).default(0),
  discountReason: z.string().optional(),
  paymentMethod: z.enum(["cash", "qris", "transfer", "card"]),
  cashReceived: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const txUnionSchema = z.discriminatedUnion("type", [
  registrationSchema,
  renewalSchema,
  dailySchema,
]);

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  const db = readLocalDb();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  const pkgMap = new Map(db.packages.map((p) => [p.id, p]));
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));

  // Kasir hanya melihat transaksi sendiri
  const rows =
    auth.staff.role === "owner"
      ? db.transactions
      : db.transactions.filter((t) => t.cashier_id === auth.staff.id);

  const sorted = [...rows]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((t) => ({
      ...t,
      member_name: t.member_id
        ? memberMap.get(t.member_id)?.full_name || "-"
        : t.guest_name || "Walk-in",
      member_code: t.member_id ? memberMap.get(t.member_id)?.member_code || null : null,
      package_name: pkgMap.get(t.package_id)?.name || "-",
      cashier_name: userMap.get(t.cashier_id) || "-",
    }));

  return NextResponse.json({ transactions: sorted });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = txUnionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data transaksi tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.type === "registration") {
      const result = processRegistrationTransaction(auth.staff, {
        ...data,
        memberData: {
          ...data.memberData,
          email: data.memberData.email || null,
        },
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (data.type === "renewal") {
      const result = processRenewalTransaction(auth.staff, data);
      return NextResponse.json(result, { status: 201 });
    }

    const result = processDailyTicketTransaction(auth.staff, data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const existingMember =
      err instanceof Error && "existingMember" in err
        ? (err as Error & { existingMember?: unknown }).existingMember
        : undefined;
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Gagal memproses transaksi",
        existingMember,
      },
      { status: 400 }
    );
  }
}
