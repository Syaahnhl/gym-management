import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import {
  getGymSettings,
  getOpenShiftForCashier,
  listMembersWithStatus,
  listPackages,
  listProducts,
} from "@/lib/db/service";
import { PosClient } from "@/components/pos/PosClient";

export default async function PosPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const openShift = getOpenShiftForCashier(staff.id);
  if (!openShift) {
    return (
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-bold text-amber-900">Shift Belum Dibuka</h1>
        <p className="mt-1 text-sm text-amber-800">
          Buka shift terlebih dahulu sebelum menggunakan kasir POS produk.
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

  const products = listProducts(true);
  const packages = listPackages(true);
  const members = listMembersWithStatus().filter((m) => m.is_active);
  const settings = getGymSettings();

  return (
    <PosClient
      products={products}
      packages={packages}
      members={members.map((m) => ({
        id: m.id,
        member_code: m.member_code,
        full_name: m.full_name,
        phone: m.phone,
      }))}
      staffRole={staff.role}
      maxCashierDiscount={settings.max_cashier_discount}
    />
  );
}
