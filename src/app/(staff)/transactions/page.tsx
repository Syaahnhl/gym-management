import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
  formatDateTimeWib,
  formatRupiah,
} from "@/lib/domain/format";

export default async function TransactionsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  const db = readLocalDb();
  const memberMap = new Map(db.members.map((m) => [m.id, m]));
  const pkgMap = new Map(db.packages.map((p) => [p.id, p.name]));

  const rows = (
    staff.role === "owner"
      ? db.transactions
      : db.transactions.filter((t) => t.cashier_id === staff.id)
  ).sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
        <p className="text-sm text-slate-500">
          {staff.role === "owner"
            ? "Seluruh transaksi pendaftaran, perpanjangan, dan tiket harian"
            : "Transaksi yang Anda proses"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Member / Tamu</th>
              <th className="px-4 py-3">Jenis & Paket</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t) => {
              const member = t.member_id ? memberMap.get(t.member_id) : null;
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                    {t.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {formatDateTimeWib(t.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {member ? member.full_name : t.guest_name || "Walk-in"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{TRANSACTION_TYPE_LABELS[t.type]}</div>
                    <div className="text-xs text-slate-400">
                      {t.package_id ? pkgMap.get(t.package_id) || "-" : "Produk POS"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {PAYMENT_METHOD_LABELS[t.payment_method]}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatRupiah(t.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {t.status === "paid" ? "Lunas" : "Void"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/transactions/${t.id}`}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Struk / Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
