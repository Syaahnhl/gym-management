import { notFound } from "next/navigation";
import { GymMateLogo } from "@/components/ui/GymMateLogo";
import { readLocalDb } from "@/lib/db/local-store";
import { getGymSettings, getMemberByPortalToken } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrCodeBox } from "@/components/ui/QrCodeBox";
import { MemberPortalProgressClient } from "@/components/portal/MemberPortalProgressClient";
import {
  TRANSACTION_TYPE_LABELS,
  formatDateId,
  formatDateTimeWib,
  formatRupiah,
} from "@/lib/domain/format";

export default async function MemberPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const member = getMemberByPortalToken(token);
  if (!member) notFound();

  const settings = getGymSettings();
  const db = readLocalDb();
  const memberMetrics = (db.body_metrics || [])
    .filter((bm) => bm.member_id === member.id)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const transactions = db.transactions
    .filter((t) => t.member_id === member.id && t.status === "paid")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const checkins = db.checkins
    .filter((c) => c.member_id === member.id)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));
  const memberMap = new Map(db.members.map((m) => [m.id, m.full_name]));
  const referrals = (db.referrals || [])
    .filter((r) => r.referrer_member_id === member.id)
    .map((r) => ({
      ...r,
      referred_name: memberMap.get(r.referred_member_id) || "-",
    }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center justify-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
            <GymMateLogo className="h-6 w-6" variant="on-blue" />
          </div>
          <span className="text-lg font-bold">{settings.name}</span>
        </div>

        <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-xl">
          <StatusBadge status={member.status_info.status} />
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            {member.full_name}
          </h1>
          <p className="font-mono text-sm text-slate-500">
            {member.member_code}
          </p>

          <div className="my-5">
            <QrCodeBox value={member.member_code} size={220} />
          </div>

          <div className="mb-3 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
            <p className="text-[11px] font-medium text-blue-700">
              ID Presensi Manual
            </p>
            <p className="font-mono text-lg font-extrabold tracking-wider text-blue-900">
              {member.member_code}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Tunjukkan QR Code ini ke scanner, atau sebutkan ID Member di atas ke
            kasir untuk presensi manual
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-3 rounded-2xl bg-blue-50/60 p-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Masa Aktif s/d</p>
              <p className="font-bold text-slate-900">
                {formatDateId(member.status_info.end_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sisa Hari</p>
              <p className="font-bold text-blue-600">
                {member.status_info.remaining_days !== null &&
                member.status_info.remaining_days >= 0
                  ? `${member.status_info.remaining_days} hari`
                  : "Habis"}
              </p>
            </div>
            <div className="col-span-2 border-t border-blue-100 pt-2">
              <p className="text-xs text-slate-500">Kode Referral Anda</p>
              <p className="font-mono font-bold text-blue-700">
                {member.referral_code || "-"}
              </p>
            </div>
          </div>
        </div>

        <MemberPortalProgressClient
          memberId={member.id}
          memberName={member.full_name}
          portalToken={token}
          initialMetrics={memberMetrics}
        />

        <div className="rounded-3xl bg-white p-5 shadow-lg">
          <h2 className="text-sm font-bold text-slate-900">
            Riwayat Transaksi
          </h2>
          <div className="mt-3 space-y-2 text-xs">
            {transactions.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {TRANSACTION_TYPE_LABELS[t.type]}
                  </p>
                  <p className="text-slate-500">
                    {formatDateTimeWib(t.created_at)}
                  </p>
                </div>
                <span className="font-bold text-slate-900">
                  {formatRupiah(t.total)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-slate-500">Belum ada transaksi.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-lg">
          <h2 className="text-sm font-bold text-slate-900">
            Riwayat Check-in Terakhir
          </h2>
          <div className="mt-3 space-y-2 text-xs">
            {checkins.slice(0, 10).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <span className="text-slate-700">
                  {formatDateTimeWib(c.checked_in_at)}
                </span>
                <span className="uppercase text-slate-500">{c.method}</span>
              </div>
            ))}
            {checkins.length === 0 && (
              <p className="text-slate-500">Belum ada riwayat check-in.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-lg">
          <h2 className="text-sm font-bold text-slate-900">
            Riwayat Referral ({referrals.length})
          </h2>
          <div className="mt-3 space-y-2 text-xs">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <span className="font-medium">{r.referred_name}</span>
                <span className="font-semibold text-emerald-700">
                  {r.status === "granted"
                    ? r.reward_type === "days"
                      ? `+${r.reward_value} hari`
                      : formatRupiah(r.reward_value)
                    : "Dibatalkan"}
                </span>
              </div>
            ))}
            {referrals.length === 0 && (
              <p className="text-slate-500">
                Bagikan kode {member.referral_code} ke teman Anda!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
