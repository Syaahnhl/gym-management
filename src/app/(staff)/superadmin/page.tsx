import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { listStaff } from "@/lib/db/service";
import { checkStorageMode } from "@/lib/supabase/db-adapter";
import { SuperadminClient } from "@/components/superadmin/SuperadminClient";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "superadmin") redirect("/dashboard");

  const db = readLocalDb();
  const storage = await checkStorageMode();

  return (
    <SuperadminClient
      currentUser={staff}
      storage={storage}
      envStatus={{
        auth_secret_configured: Boolean(process.env.AUTH_SECRET),
        supabase_configured: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ),
        midtrans_configured: Boolean(process.env.MIDTRANS_SERVER_KEY),
        xendit_configured: Boolean(process.env.XENDIT_CALLBACK_TOKEN),
        cron_secret_configured: Boolean(process.env.CRON_SECRET),
      }}
      counts={{
        branches: (db.branches || []).length,
        users: db.users.length,
        members: db.members.length,
        transactions: db.transactions.length,
        checkins: db.checkins.length,
        products: (db.products || []).length,
      }}
      initialStaff={listStaff()}
      initialBranches={db.branches || []}
      gymName={db.gym_settings.name}
    />
  );
}
