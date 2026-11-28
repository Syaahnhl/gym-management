import { NextRequest, NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { hashPassword } from "@/lib/db/seed-data";
import { listStaff } from "@/lib/db/service";
import { checkStorageMode } from "@/lib/supabase/db-adapter";

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff(["superadmin"]);
  if ("error" in auth) return auth.error;

  const action = req.nextUrl.searchParams.get("action");
  const db = readLocalDb();

  if (action === "backup") {
    const safeBackup = {
      ...db,
      users: db.users.map(({ password_hash: _pw, ...u }) => u),
      exported_at: new Date().toISOString(),
    };
    return new NextResponse(JSON.stringify(safeBackup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gymmate-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  }

  const storage = await checkStorageMode();

  return NextResponse.json({
    storage,
    env: {
      auth_secret_configured: Boolean(process.env.AUTH_SECRET),
      supabase_configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      midtrans_configured: Boolean(process.env.MIDTRANS_SERVER_KEY),
      xendit_configured: Boolean(process.env.XENDIT_CALLBACK_TOKEN),
      cron_secret_configured: Boolean(process.env.CRON_SECRET),
    },
    counts: {
      branches: (db.branches || []).length,
      users: db.users.length,
      members: db.members.length,
      transactions: db.transactions.length,
      checkins: db.checkins.length,
      products: (db.products || []).length,
    },
    staff: listStaff(),
    branches: db.branches || [],
    settings: db.gym_settings,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiStaff(["superadmin"]);
  if ("error" in auth) return auth.error;

  try {
    const body = (await req.json()) as {
      action?: string;
      user_id?: string;
      new_password?: string;
      is_active?: boolean;
    };

    const db = readLocalDb();

    if (body.action === "reset_password") {
      if (!body.user_id || !body.new_password || body.new_password.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 }
        );
      }
      const idx = db.users.findIndex((u) => u.id === body.user_id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Akun tidak ditemukan" },
          { status: 404 }
        );
      }
      db.users[idx].password_hash = hashPassword(body.new_password);
      writeLocalDb(db);
      return NextResponse.json({ ok: true, message: "Password berhasil direset" });
    }

    if (body.action === "toggle_active") {
      if (!body.user_id) {
        return NextResponse.json(
          { error: "user_id wajib diisi" },
          { status: 400 }
        );
      }
      if (body.user_id === auth.staff.id) {
        return NextResponse.json(
          { error: "Tidak dapat menonaktifkan akun Superadmin yang sedang dipakai" },
          { status: 400 }
        );
      }
      const idx = db.users.findIndex((u) => u.id === body.user_id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Akun tidak ditemukan" },
          { status: 404 }
        );
      }
      db.users[idx].is_active = Boolean(body.is_active);
      writeLocalDb(db);
      return NextResponse.json({ ok: true, staff: listStaff() });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses aksi" },
      { status: 400 }
    );
  }
}
