"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  Clock,
  CreditCard,
  Dumbbell,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
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

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: QrCode },
  { href: "/members", label: "Data Member", icon: Users },
  { href: "/members/new", label: "Member Baru", icon: UserPlus },
  { href: "/daily-ticket", label: "Tiket Harian", icon: Ticket },
  { href: "/pos", label: "Kasir POS", icon: ShoppingCart },
  { href: "/transactions", label: "Transaksi", icon: CreditCard },
  { href: "/expiring", label: "Akan Habis", icon: BellRing },
  { href: "/freezes", label: "Freeze / Cuti", icon: PauseCircle },
  { href: "/expenses", label: "Pengeluaran", icon: Receipt },
  { href: "/shift", label: "Shift Kasir", icon: Clock },
  { href: "/packages", label: "Paket Membership", icon: PackageIcon, ownerOnly: true },
  { href: "/products", label: "Produk POS", icon: ShoppingBag, ownerOnly: true },
  { href: "/stock", label: "Stok Produk", icon: Warehouse, ownerOnly: true },
  { href: "/promotions", label: "Promo & Voucher", icon: Tag, ownerOnly: true },
  { href: "/staff", label: "Akun Staff", icon: UserCheck, ownerOnly: true },
  { href: "/reports/revenue", label: "Laporan Pendapatan", icon: BarChart3, ownerOnly: true },
  { href: "/reports/profit-loss", label: "Laporan Laba Rugi", icon: BarChart3, ownerOnly: true },
  { href: "/reports/members", label: "Laporan Member", icon: Users, ownerOnly: true },
  { href: "/reports/checkins", label: "Laporan Check-in", icon: QrCode, ownerOnly: true },
  { href: "/reports/promotions", label: "Laporan Promo", icon: Tag, ownerOnly: true },
  { href: "/activity-log", label: "Log Aktivitas", icon: Activity, ownerOnly: true },
  { href: "/settings", label: "Pengaturan Gym", icon: Settings, ownerOnly: true },
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || staff.role === "owner"
  );

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
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{settings.name}</p>
          <p className="text-xs text-slate-400">
            {staff.role === "owner" ? "Owner" : "Kasir"} · {staff.name.split(" ")[0]}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/members" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3 space-y-2">
        <Link
          href="/shift"
          onClick={() => setMobileOpen(false)}
          className={`block rounded-lg px-3 py-2 text-xs font-medium ${
            openShift
              ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
              : "bg-amber-950/70 text-amber-300 border border-amber-800"
          }`}
        >
          {openShift ? "Shift Terbuka (Aktif)" : "Shift Belum Dibuka"}
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPwModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600/90 px-2.5 py-2 text-xs font-medium text-white hover:bg-rose-600"
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
          <div className="relative z-10 w-64 max-w-[80vw]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-900">{settings.name}</span>
          <Link
            href="/checkin"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Check-in
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
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
