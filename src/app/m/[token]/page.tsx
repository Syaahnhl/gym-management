import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { readLocalDb } from "@/lib/db/local-store";
import { getGymSettings, getMemberByPortalToken } from "@/lib/db/service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrCodeBox } from "@/components/ui/QrCodeBox";
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
  const transactions = db.transactions
    .filter((t) => t.member_id === member.id && t.status === "paid")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const checkins = db.checkins
    .filter((c) => c.member_id === member.id)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center justify-center gap-2 text-white">
          <Dumbbell className="h-6 w-6 text-emerald-400" />
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

          <p className="text-xs text-slate-500">
            Tunjukkan QR Code ini ke kasir saat check-in
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Masa Aktif s/d</p>
              <p className="font-bold text-slate-900">
                {formatDateId(member.status_info.end_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sisa Hari</p>
              <p className="font-bold text-emerald-600">
                {member.status_info.remaining_days !== null &&
                member.status_info.remaining_days >= 0
                  ? `${member.status_info.remaining_days} hari`
                  : "Habis"}
              </p>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
