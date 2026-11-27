import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import {
  getGymSettings,
  getOpenShiftForCashier,
  listPackages,
} from "@/lib/db/service";
import { getJakartaTodayStr } from "@/lib/domain/membership";
import { NewMemberClient } from "@/components/members/NewMemberClient";

export default async function NewMemberPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const openShift = getOpenShiftForCashier(staff.id);
  const packages = listPackages(true).filter((p) => p.type === "membership");
  const settings = getGymSettings();

  if (!openShift) {
    return (
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-900">
          Shift Belum Dibuka
        </h1>
        <p className="mt-1 text-sm text-amber-800">
          Anda harus membuka shift kasir terlebih dahulu sebelum mendaftarkan
          member baru dan menerima pembayaran.
        </p>
        <Link
          href="/shift"
          className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Buka Shift Sekarang
        </Link>
      </div>
    );
  }

  return (
    <NewMemberClient
      packages={packages}
      staffRole={staff.role}
      maxCashierDiscount={settings.max_cashier_discount}
      todayStr={getJakartaTodayStr()}
    />
  );
}
