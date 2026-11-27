import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getOpenShiftForCashier, listPackages } from "@/lib/db/service";
import { DailyTicketClient } from "@/components/transactions/DailyTicketClient";

export default async function DailyTicketPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const openShift = getOpenShiftForCashier(staff.id);
  if (!openShift) {
    return (
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-900">Shift Belum Dibuka</h1>
        <p className="mt-1 text-sm text-amber-800">
          Buka shift terlebih dahulu sebelum menjual tiket harian.
        </p>
        <Link
          href="/shift"
          className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Buka Shift
        </Link>
      </div>
    );
  }

  const dailyPackages = listPackages(true).filter((p) => p.type === "daily");
  return <DailyTicketClient packages={dailyPackages} />;
}
