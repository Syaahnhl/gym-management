"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  Building2,
  CalendarDays,
  ChevronDown,
  Clock,
  CreditCard,
  Dumbbell,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package as PackageIcon,
  PauseCircle,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Ticket,
  UserCheck,
  UserPlus,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import type { GymSettings, SafeStaffUser, Shift } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  ownerOnly?: boolean;
  items: NavItem[];
}

const CASHIER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard Kasir", icon: LayoutDashboard },
  { href: "/checkin", label: "Presensi (QR / ID)", icon: QrCode },
  { href: "/pos", label: "Kasir POS", icon: ShoppingCart },
  { href: "/members", label: "Data Member", icon: Users },
  { href: "/daily-ticket", label: "Tiket Harian", icon: Ticket },
  { href: "/transactions", label: "Transaksi", icon: CreditCard },
  { href: "/shift", label: "Shift Kasir", icon: Clock },
  { href: "/lockers", label: "Loker Member", icon: KeyRound },
  { href: "/expiring", label: "Member Akan Habis", icon: BellRing },
  { href: "/expenses", label: "Catat Pengeluaran", icon: Receipt },
];

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard Owner", icon: LayoutDashboard },
  { href: "/members", label: "Data Member", icon: Users },
  { href: "/transactions", label: "Pantau Transaksi", icon: CreditCard },
  { href: "/reports/profit-loss", label: "Laba Rugi", icon: BarChart3, ownerOnly: true },
  { href: "/reports/revenue", label: "Pendapatan", icon: BarChart3, ownerOnly: true },
];

const NAV_GROUPS: NavGroup[] = [
  {
    id: "catalog",
    label: "Menu, Harga & Stok",
    ownerOnly: true,
    items: [
      { href: "/packages", label: "Paket & Harga", icon: PackageIcon, ownerOnly: true },
      { href: "/products", label: "Produk & Harga POS", icon: ShoppingBag, ownerOnly: true },
      { href: "/stock", label: "Stok Produk", icon: Warehouse, ownerOnly: true },
      { href: "/promotions", label: "Promo & Voucher", icon: Tag, ownerOnly: true },
      { href: "/expenses", label: "Pengeluaran", icon: Receipt, ownerOnly: true },
    ],
  },
  {
    id: "programs",
    label: "Program & Layanan",
    ownerOnly: true,
    items: [
      { href: "/trainers", label: "Personal Trainer", icon: Dumbbell, ownerOnly: true },
      { href: "/classes", label: "Jadwal Kelas", icon: CalendarDays, ownerOnly: true },
      { href: "/freezes", label: "Freeze / Cuti", icon: PauseCircle, ownerOnly: true },
      { href: "/leads", label: "CRM Prospek & Trial", icon: UserPlus, ownerOnly: true },
      { href: "/body-metrics", label: "Body Metrics & BMI", icon: Activity, ownerOnly: true },
    ],
  },
  {
    id: "reports",
    label: "Laporan & Analitik",
    ownerOnly: true,
    items: [
      { href: "/reports/members", label: "Statistik Member", icon: Users, ownerOnly: true },
      { href: "/reports/checkins", label: "Laporan Check-in", icon: QrCode, ownerOnly: true },
      { href: "/reports/promotions", label: "Efektivitas Promo", icon: Tag, ownerOnly: true },
      { href: "/reports/commissions", label: "Komisi Trainer", icon: Dumbbell, ownerOnly: true },
    ],
  },
  {
    id: "system",
    label: "Pengawasan & Pengaturan",
    ownerOnly: true,
    items: [
      { href: "/expiring", label: "Member Akan Habis", icon: BellRing, ownerOnly: true },
      { href: "/whatsapp-logs", label: "WA Otomatis", icon: MessageSquare, ownerOnly: true },
      { href: "/branches", label: "Cabang Gym", icon: Building2, ownerOnly: true },
      { href: "/staff", label: "Akun Staff & Kasir", icon: UserCheck, ownerOnly: true },
      { href: "/activity-log", label: "Log Aktivitas", icon: Activity, ownerOnly: true },
      { href: "/settings", label: "Pengaturan Gym", icon: Settings, ownerOnly: true },
    ],
  },
];

export function AppShell({
  staff,
  settings,
  openShift,
  children,
}: {
  staff: SafeStaffUser;
  settings: GymSettings;
  openShift: Shift | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const isRouteActive = (href: string) =>
    pathname === href ||
    (href !== "/members" && pathname.startsWith(`${href}/`));

  const initialOpenGroup =
    NAV_GROUPS.find((g) => g.items.some((item) => isRouteActive(item.href)))
      ?.id ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(initialOpenGroup);

  const visibleGroups = NAV_GROUPS.filter(
    (g) => !g.ownerOnly || staff.role === "owner"
  )
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.ownerOnly || staff.role === "owner"),
    }))
    .filter((g) => g.items.length > 0);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPwMsg(data.error || "Gagal mengganti password");
      return;
    }
    setOldPassword("");
    setNewPassword("");
    setPwModal(false);
    alert("Password berhasil diperbarui.");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-blue-100 bg-white text-slate-800">
      <div className="flex items-center gap-3 border-b border-blue-100 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{settings.name}</p>
          <p className="text-xs text-slate-500">
            {staff.role === "owner" ? "Owner" : "Kasir"} · {staff.name.split(" ")[0]}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {staff.role === "owner" ? "Menu Utama" : "Operasional Kasir"}
          </p>
          <div className="space-y-1">
            {(staff.role === "owner" ? PRIMARY_NAV : CASHIER_NAV).map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {visibleGroups.length > 0 && (
          <div className="space-y-1.5 border-t border-blue-100 pt-3">
          {visibleGroups.map((group) => {
            const isOpen = openGroup === group.id;
            const hasActive = group.items.some((i) => isRouteActive(i.href));
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    hasActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isRouteActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            active
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </nav>

      <div className="space-y-2 border-t border-blue-100 p-3">
        {staff.role === "cashier" && (
          <Link
            href="/shift"
            onClick={() => setMobileOpen(false)}
            className={`block rounded-lg border px-3 py-2 text-xs font-medium ${
              openShift
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {openShift ? "Shift Terbuka (Aktif)" : "Shift Belum Dibuka"}
          </Link>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPwModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-2 text-xs font-medium text-white hover:bg-rose-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-3.5 z-10 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Quick-Action Header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-blue-100 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="shrink-0 rounded-lg border border-blue-200 p-2 text-blue-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-bold text-slate-900 lg:hidden">
              {settings.name}
            </span>
            <span className="hidden truncate text-xs font-semibold text-slate-600 lg:inline">
              {settings.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {staff.role === "cashier" && (
              <>
                <Link
                  href="/pos"
                  className="hidden items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:inline-flex"
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> Kasir POS
                </Link>
                <Link
                  href="/checkin"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <QrCode className="h-3.5 w-3.5" /> Scan QR
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {/* Modal Ganti Password (FR-05) */}
      {pwModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Ganti Password</h2>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password Lama
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {pwMsg && <p className="text-sm text-rose-600">{pwMsg}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPwModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
