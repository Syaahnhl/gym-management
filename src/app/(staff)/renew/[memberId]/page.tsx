import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import {
  getGymSettings,
  getMemberById,
  getOpenShiftForCashier,
  listPackages,
} from "@/lib/db/service";
import { RenewClient } from "@/components/transactions/RenewClient";

export default async function RenewPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const { memberId } = await params;
  const member = getMemberById(memberId);
  if (!member) notFound();

  const openShift = getOpenShiftForCashier(staff.id);
  if (!openShift) {
    return (
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-900">Shift Belum Dibuka</h1>
        <p className="mt-1 text-sm text-amber-800">
          Buka shift terlebih dahulu sebelum memproses perpanjangan member.
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

  const packages = listPackages(true).filter((p) => p.type === "membership");
  const settings = getGymSettings();

  return (
    <RenewClient
      member={member}
      packages={packages}
      staffRole={staff.role}
      maxCashierDiscount={settings.max_cashier_discount}
    />
  );
}
