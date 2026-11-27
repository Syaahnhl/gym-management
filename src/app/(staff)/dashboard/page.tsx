import Link from "next/link";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  BellRing,
  Clock,
  CreditCard,
  QrCode,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import {
  getOpenShiftForCashier,
  getShiftSummary,
  listMembersWithStatus,
} from "@/lib/db/service";
import { formatRupiah } from "@/lib/domain/format";
import { GYM_TIMEZONE, getJakartaTodayStr } from "@/lib/domain/membership";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const db = readLocalDb();
  const todayStr = getJakartaTodayStr();
  const monthPrefix = todayStr.slice(0, 7);

  if (staff.role === "cashier") {
    const openShift = getOpenShiftForCashier(staff.id);
    const summary = openShift ? getShiftSummary(openShift.id) : null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Halo, {staff.name}
          </h1>
          <p className="text-sm text-slate-500">
            Ringkasan shift kasir dan akses cepat operasional harian
          </p>
        </div>

        {!openShift ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-bold text-amber-900">
              Shift Kasir Belum Dibuka
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Anda harus membuka shift terlebih dahulu sebelum dapat memproses
              transaksi pendaftaran, perpanjangan, atau tiket harian.
            </p>
            <Link
              href="/shift"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <Clock className="h-4 w-4" />
              Buka Shift Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Saldo Awal Kas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatRupiah(openShift.opening_cash)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Transaksi Shift Ini
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary?.transaction_count ?? 0} transaksi
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Total Pemasukan Shift
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatRupiah(summary?.total_revenue ?? 0)}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/pos"
            className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm transition hover:border-blue-500"
          >
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Kasir POS</p>
              <p className="text-xs text-slate-500">Jual produk &amp; cetak struk</p>
            </div>
          </Link>
          <Link
            href="/checkin"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400"
          >
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Check-in Member</p>
              <p className="text-xs text-slate-500">Scan QR atau input ID</p>
            </div>
          </Link>
          <Link
            href="/members/new"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400"
          >
            <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Member Baru</p>
              <p className="text-xs text-slate-500">Daftar &amp; bayar paket</p>
            </div>
          </Link>
          <Link
            href="/daily-ticket"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400"
          >
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Tiket Harian</p>
              <p className="text-xs text-slate-500">Walk-in pengunjung</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Owner Dashboard (FR-47, FR-48)
  const paidTxs = db.transactions.filter((t) => t.status === "paid");
  const revenueToday = paidTxs
    .filter((t) => getJakartaTodayStr(new Date(t.created_at)) === todayStr)
    .reduce((acc, t) => acc + t.total, 0);
  const revenueMonth = paidTxs
    .filter((t) => getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix))
    .reduce((acc, t) => acc + t.total, 0);
  const newMembersMonth = paidTxs.filter(
    (t) =>
      t.type === "registration" &&
      getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix)
  ).length;
  const renewalsMonth = paidTxs.filter(
    (t) =>
      t.type === "renewal" &&
      getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix)
  ).length;

  const members = listMembersWithStatus();
  const activeMembers = members.filter(
    (m) => m.status_info.status === "active" || m.status_info.status === "expiring"
  ).length;
  const expiringMembers = members.filter(
    (m) => m.status_info.status === "expiring"
  ).length;
  const checkinsToday = db.checkins.filter(
    (c) => getJakartaTodayStr(new Date(c.checked_in_at)) === todayStr && !c.is_duplicate
  ).length;
  const lowStockProducts = (db.products || []).filter(
    (p) => p.is_active && p.stock <= p.min_stock
  );

  const revenue30Days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dStr = format(
      toZonedTime(subDays(new Date(), i), GYM_TIMEZONE),
      "yyyy-MM-dd"
    );
    const total = paidTxs
      .filter((t) => getJakartaTodayStr(new Date(t.created_at)) === dStr)
      .reduce((acc, t) => acc + t.total, 0);
    revenue30Days.push({ date: dStr.slice(5), total });
  }

  const hourlyMap = new Map<number, number>();
  for (let h = 6; h <= 22; h++) hourlyMap.set(h, 0);
  for (const c of db.checkins) {
    const h = toZonedTime(new Date(c.checked_in_at), GYM_TIMEZONE).getHours();
    if (hourlyMap.has(h)) hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1);
  }
  const hourlyCheckins = Array.from(hourlyMap.entries()).map(([hour, count]) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    count,
  }));

  const kpis = [
    {
      label: "Pendapatan Hari Ini",
      value: formatRupiah(revenueToday),
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: formatRupiah(revenueMonth),
      icon: CreditCard,
      color: "text-emerald-700",
    },
    {
      label: "Member Aktif",
      value: `${activeMembers} orang`,
      icon: Users,
      color: "text-sky-600",
    },
    {
      label: "Check-in Hari Ini",
      value: `${checkinsToday} kunjungan`,
      icon: QrCode,
      color: "text-indigo-600",
    },
    {
      label: "Member Baru Bulan Ini",
      value: `${newMembersMonth} orang`,
      icon: UserPlus,
      color: "text-slate-900",
    },
    {
      label: "Perpanjangan Bulan Ini",
      value: `${renewalsMonth} transaksi`,
      icon: Users,
      color: "text-slate-900",
    },
    {
      label: "Akan Habis",
      value: `${expiringMembers} member`,
      icon: BellRing,
      color: "text-amber-600",
      href: "/expiring",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Owner</h1>
          <p className="text-sm text-slate-500">
            Ringkasan operasional gym, pendapatan, dan aktivitas member
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/checkin"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Buka Check-in
          </Link>
          <Link
            href="/reports/revenue"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Lihat Laporan
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const card = (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className={`mt-2 text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </p>
            </div>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="block hover:opacity-90">
              {card}
            </Link>
          ) : (
            <div key={kpi.label}>{card}</div>
          );
        })}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-rose-900">
                Peringatan Stok Minimum ({lowStockProducts.length} produk)
              </p>
              <p className="text-xs text-rose-700">
                {lowStockProducts.map((p) => `${p.name} (sisa ${p.stock})`).join(", ")}
              </p>
            </div>
            <Link
              href="/stock"
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Tambah Stok
            </Link>
          </div>
        </div>
      )}

      <DashboardCharts
        revenue30Days={revenue30Days}
        hourlyCheckins={hourlyCheckins}
      />
    </div>
  );
}
