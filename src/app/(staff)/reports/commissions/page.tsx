import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { getTrainerCommissionsReport } from "@/lib/db/phase2b-service";
import { formatRupiah } from "@/lib/domain/format";

export default async function CommissionsReportPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  const rows = getTrainerCommissionsReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Laporan Komisi Trainer
        </h1>
        <p className="text-sm text-slate-500">
          Total komisi dari sesi PT yang berstatus selesai
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Skema Komisi</th>
              <th className="px-4 py-3">Sesi Selesai</th>
              <th className="px-4 py-3">Total Fee Sesi</th>
              <th className="px-4 py-3 text-right">Total Komisi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  {r.commission_type === "percent"
                    ? `${r.commission_value}%`
                    : formatRupiah(r.commission_value)}
                </td>
                <td className="px-4 py-3">{r.completed_sessions} sesi</td>
                <td className="px-4 py-3">{formatRupiah(r.total_fee)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">
                  {formatRupiah(r.total_commission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
