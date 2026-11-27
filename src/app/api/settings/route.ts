import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { getGymSettings, updateGymSettings } from "@/lib/db/service";

const updateSchema = z.object({
  name: z.string().min(2, "Nama gym minimal 2 karakter").optional(),
  address: z.string().optional(),
  logo_url: z.string().nullable().optional(),
  whatsapp_number: z.string().optional(),
  reminder_days: z.number().int().min(1).max(60).optional(),
  reminder_template: z.string().min(10).optional(),
  max_cashier_discount: z.number().int().min(0).optional(),
  freeze_allowed: z.boolean().optional(),
  freeze_min_days: z.number().int().min(1).optional(),
  freeze_max_days: z.number().int().min(1).optional(),
  freeze_max_days_per_period: z.number().int().min(1).optional(),
  freeze_fee: z.number().int().min(0).optional(),
  cashier_can_record_expense: z.boolean().optional(),
  referral_enabled: z.boolean().optional(),
  referral_discount_amount: z.number().int().min(0).optional(),
  referral_reward_type: z.enum(["days", "discount_balance"]).optional(),
  referral_reward_value: z.number().int().min(0).optional(),
});

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ settings: getGymSettings() });
}

export async function PUT(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }
    const settings = updateGymSettings(auth.staff.id, parsed.data);
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan pengaturan" },
      { status: 400 }
    );
  }
}
