import { NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import {
  listWhatsappLogs,
  sendAutomatedWhatsappReminders,
} from "@/lib/db/phase2b-service";

export async function GET() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ logs: listWhatsappLogs() });
}

export async function POST() {
  const auth = await requireApiStaff();
  if ("error" in auth) return auth.error;
  try {
    const result = await sendAutomatedWhatsappReminders(auth.staff.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengirim pengingat" },
      { status: 400 }
    );
  }
}
