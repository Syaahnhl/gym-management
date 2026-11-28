"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { Branch, SafeStaffUser, StaffRole } from "@/types/database";
import { formatDateId } from "@/lib/domain/format";
import { OutletQrCard } from "@/components/ui/OutletQrCard";

export function SuperadminClient({
  currentUser,
  storage,
  envStatus,
  counts,
  initialStaff,
  initialBranches,
  gymName,
}: {
  currentUser: SafeStaffUser;
  storage: { mode: "supabase" | "local"; connected: boolean };
  envStatus: {
    auth_secret_configured: boolean;
    supabase_configured: boolean;
    midtrans_configured: boolean;
    xendit_configured: boolean;
    cron_secret_configured: boolean;
  };
  counts: {
    branches: number;
    users: number;
    members: number;
    transactions: number;
    checkins: number;
    products: number;
  };
  initialStaff: SafeStaffUser[];
  initialBranches: Branch[];
  gymName: string;
}) {
  const [staffList, setStaffList] = useState<SafeStaffUser[]>(initialStaff);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<StaffRole>("owner");

  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: data.error || "Gagal membuat akun" });
      return;
    }
    setStaffList((prev) => [data.staff, ...prev]);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setFeedback({
      type: "success",
      text: `Akun ${data.staff.role} (${data.staff.email}) berhasil dibuat.`,
    });
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: branchName,
        address: branchAddress,
        phone: branchPhone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: data.error || "Gagal menambah outlet" });
      return;
    }
    setBranches((prev) => [...prev, data.branch]);
    setBranchName("");
    setBranchAddress("");
    setBranchPhone("");
    setFeedback({
      type: "success",
      text: `Outlet "${data.branch.name}" berhasil ditambahkan beserta QR absensinya.`,
    });
  }

  async function handleToggleActive(user: SafeStaffUser) {
    setFeedback(null);
    const res = await fetch("/api/superadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_active",
        user_id: user.id,
        is_active: !user.is_active,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: data.error || "Gagal mengubah status" });
      return;
    }
    setStaffList(data.staff);
    setFeedback({
      type: "success",
      text: `Status akun ${user.name} diperbarui.`,
    });
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTargetId) return;
    setFeedback(null);
    const res = await fetch("/api/superadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset_password",
        user_id: resetTargetId,
        new_password: resetPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: data.error || "Gagal reset password" });
      return;
    }
    setResetTargetId(null);
    setResetPassword("");
    setFeedback({ type: "success", text: data.message });
  }

  async function handleTriggerWa() {
    setWaLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/whatsapp/send-reminders", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Gagal kirim WA" });
        return;
      }
      setFeedback({
        type: "success",
        text: `Pengingat WA diproses untuk ${data.sent_count ?? 0} member.`,
      });
    } finally {
      setWaLoading(false);
    }
  }

  const envItems = [
    { label: "AUTH_SECRET", ok: envStatus.auth_secret_configured },
    { label: "Supabase URL & Key", ok: envStatus.supabase_configured },
    { label: "Midtrans Server Key", ok: envStatus.midtrans_configured },
    { label: "Xendit Callback Token", ok: envStatus.xendit_configured },
    { label: "Cron Secret WA", ok: envStatus.cron_secret_configured },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Superadmin GymMate · {currentUser.name}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Console Pengelola Platform ({gymName})
          </h1>
          <p className="text-sm text-slate-500">
            Kelola akun Owner/Kasir, outlet &amp; QR absensi, kesiapan produksi,
            serta backup data.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={waLoading}
            onClick={handleTriggerWa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            {waLoading ? "Mengirim WA..." : "Jalankan WA Reminder"}
          </button>
          <a
            href="/api/superadmin?action=backup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Backup Database (JSON)
          </a>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Outlet / Cabang", value: branches.length },
          { label: "Akun Staff & Owner", value: staffList.length },
          { label: "Total Member", value: counts.members },
          { label: "Total Transaksi", value: counts.transactions },
          { label: "Total Check-in", value: counts.checkins },
          { label: "Produk POS", value: counts.products },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Status Infrastruktur Live
            </h2>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Mode Penyimpanan</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold uppercase text-blue-700">
                {storage.mode} ({storage.connected ? "Terhubung" : "Terputus"})
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {envItems.map((e) => (
              <div
                key={e.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <span className="font-mono text-slate-700">{e.label}</span>
                {e.ok ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <XCircle className="h-3.5 w-3.5" /> Belum diset
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            <Link
              href="/settings"
              className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Pengaturan Gym &amp; WA
            </Link>
            <Link
              href="/activity-log"
              className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Log Aktivitas
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Kelola Akun Owner, Kasir &amp; Superadmin
            </h2>
          </div>

          <form
            onSubmit={handleCreateUser}
            className="grid gap-2.5 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-4"
          >
            <input
              required
              placeholder="Nama lengkap"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <input
              required
              type="email"
              placeholder="Email login"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="Password (min 6)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <div className="flex gap-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as StaffRole)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold"
              >
                <option value="owner">Owner</option>
                <option value="cashier">Kasir</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Buat
              </button>
            </div>
          </form>

          {resetTargetId && (
            <form
              onSubmit={handleResetPassword}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs"
            >
              <KeyRound className="h-4 w-4 text-amber-700" />
              <span className="font-semibold text-amber-900">
                Reset password untuk{" "}
                {staffList.find((s) => s.id === resetTargetId)?.email}:
              </span>
              <input
                required
                type="password"
                minLength={6}
                placeholder="Password baru..."
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetTargetId(null);
                  setResetPassword("");
                }}
                className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-800"
              >
                Batal
              </button>
            </form>
          )}

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {staffList.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        u.role === "superadmin"
                          ? "bg-indigo-100 text-indigo-700"
                          : u.role === "owner"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                    {!u.is_active && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {u.email} · Dibuat {formatDateId(u.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetTargetId(u.id);
                      setResetPassword("");
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset PW
                  </button>
                  {u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        u.is_active
                          ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
                          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            Outlet / Cabang &amp; QR Absensi Mandiri
          </h2>
        </div>

        <form
          onSubmit={handleCreateBranch}
          className="grid gap-3 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-4"
        >
          <input
            required
            placeholder="Nama Outlet / Cabang"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          />
          <input
            required
            placeholder="Alamat Outlet"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          />
          <input
            placeholder="No. Telepon"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            + Tambah Outlet
          </button>
        </form>

        <div className="grid gap-4 lg:grid-cols-2">
          {branches.map((b) => (
            <OutletQrCard
              key={b.id}
              branchId={b.id}
              branchName={b.name}
              address={b.address}
              phone={b.phone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
