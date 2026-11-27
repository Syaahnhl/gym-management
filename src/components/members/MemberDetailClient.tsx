"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import type {
  Checkin,
  Membership,
  Referral,
  StaffRole,
  Transaction,
} from "@/types/database";
import type { MemberWithStatus } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrCodeBox } from "@/components/ui/QrCodeBox";
import {
  buildWhatsAppUrl,
  formatDateId,
  formatDateTimeWib,
  formatRupiah,
} from "@/lib/domain/format";

export function MemberDetailClient({
  initialMember,
  memberships,
  transactions,
  checkins,
  referrals = [],
  staffRole,
  gymName,
}: {
  initialMember: MemberWithStatus;
  memberships: Membership[];
  transactions: Transaction[];
  checkins: Checkin[];
  referrals?: (Referral & { referred_name: string })[];
  staffRole: StaffRole;
  gymName: string;
}) {
  const router = useRouter();
  const [member, setMember] = useState(initialMember);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(member.full_name);
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address || "");
  const [notes, setNotes] = useState(member.notes || "");
  const [error, setError] = useState<string | null>(null);

  const portalPath = `/m/${member.portal_token}`;
  const portalFullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${portalPath}`
      : portalPath;
  const waPortalMsg = `Halo ${member.full_name}, selamat datang di ${gymName}! Kode member Anda: ${member.member_code}. Lihat QR Code & masa aktif Anda di sini: ${portalFullUrl}`;

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        address: address || null,
        notes: notes || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan perubahan");
      return;
    }
    setMember((prev) => ({ ...prev, ...data.member }));
    setEditing(false);
    router.refresh();
  }

  async function handleToggleActive() {
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !member.is_active }),
    });
    if (res.ok) {
      router.refresh();
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {member.full_name}
            </h1>
            <StatusBadge status={member.status_info.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {member.member_code} · {member.phone}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {member.is_active && (
            <>
              <Link
                href={`/renew/${member.id}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Perpanjang Paket
              </Link>
              <Link
                href="/freezes"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Freeze
              </Link>
            </>
          )}
          <a
            href={buildWhatsAppUrl(member.phone, waPortalMsg)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="h-4 w-4" />
            Kirim Portal WA
          </a>
          {staffRole === "owner" && (
            <button
              type="button"
              onClick={handleToggleActive}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {member.is_active ? "Nonaktifkan Member" : "Aktifkan Member"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <QrCodeBox value={member.member_code} size={180} />
          <p className="mt-3 font-mono text-sm font-bold text-slate-900">
            {member.member_code}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Masa aktif s/d:{" "}
            <strong className="text-slate-900">
              {formatDateId(member.status_info.end_date)}
            </strong>
          </p>
          <Link
            href={portalPath}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
          >
            Buka Portal Member <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Informasi Pribadi
            </h2>
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              {editing ? "Batal" : "Edit Data"}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Nama Lengkap
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Nomor HP
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Alamat
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Simpan Perubahan
              </button>
            </form>
          ) : (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">
                  {member.email || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Jenis Kelamin</dt>
                <dd className="font-medium text-slate-900">
                  {member.gender === "L"
                    ? "Laki-laki"
                    : member.gender === "P"
                    ? "Perempuan"
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Alamat</dt>
                <dd className="font-medium text-slate-900">
                  {member.address || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kontak Darurat</dt>
                <dd className="font-medium text-slate-900">
                  {member.emergency_contact || "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Kode Referral & Saldo Bonus</dt>
                <dd className="font-mono font-semibold text-emerald-700">
                  {member.referral_code || "-"} · Saldo Diskon:{" "}
                  {formatRupiah(member.discount_balance || 0)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Catatan</dt>
                <dd className="font-medium text-slate-900">
                  {member.notes || "-"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Transaksi & Masa Aktif
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            {transactions.map((t) => {
              const ms = memberships.find((m) => m.transaction_id === t.id);
              return (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-slate-800">
                      {t.invoice_number}
                      {t.status === "void" && (
                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">
                          VOID
                        </span>
                      )}
                    </p>
                    {ms && (
                      <p className="text-xs text-slate-500">
                        {formatDateId(ms.start_date)} – {formatDateId(ms.end_date)}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(t.total)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Check-in ({checkins.length})
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            {checkins.slice(0, 15).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
              >
                <span className="text-slate-700">
                  {formatDateTimeWib(c.checked_in_at)}
                </span>
                <span className="text-xs uppercase text-slate-500">
                  {c.method}
                  {c.is_duplicate ? " · Duplikat" : ""}
                </span>
              </div>
            ))}
            {checkins.length === 0 && (
              <p className="text-slate-500">Belum ada riwayat check-in.</p>
            )}
          </div>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Referral ({referrals.length})
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
              >
                <div>
                  <span className="font-medium">{r.referred_name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    ({r.reward_type === "days" ? `+${r.reward_value} hari` : formatRupiah(r.reward_value)})
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.status === "granted"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {r.status === "granted" ? "Diberikan" : "Dibatalkan"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
