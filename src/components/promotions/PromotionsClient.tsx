"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { DiscountType, Promotion } from "@/types/database";
import { formatDateId, formatRupiah } from "@/lib/domain/format";
import { addDaysToDateStr } from "@/lib/domain/membership";

export function PromotionsClient({
  initialPromotions,
  todayStr,
}: {
  initialPromotions: Promotion[];
  todayStr: string;
}) {
  const [promos, setPromos] = useState<Promotion[]>(initialPromotions);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("nominal");
  const [discountValue, setDiscountValue] = useState(50000);
  const [appliesTo, setAppliesTo] = useState<"all" | "package" | "product">("all");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(addDaysToDateStr(todayStr, 30));
  const [maxQuota, setMaxQuota] = useState<string>("50");
  const [maxPerMember, setMaxPerMember] = useState<string>("1");
  const [newMemberOnly, setNewMemberOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code: code.trim() || null,
        discount_type: discountType,
        discount_value: Number(discountValue),
        applies_to: appliesTo,
        start_date: startDate,
        end_date: endDate,
        max_quota: maxQuota ? Number(maxQuota) : null,
        max_per_member: maxPerMember ? Number(maxPerMember) : null,
        new_member_only: newMemberOnly,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal membuat promo");
      return;
    }
    setPromos((prev) => [...prev, data.promotion]);
    setModalOpen(false);
    setName("");
    setCode("");
  }

  async function toggleActive(p: Promotion) {
    const res = await fetch(`/api/promotions/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    const data = await res.json();
    if (res.ok) {
      setPromos((prev) =>
        prev.map((x) => (x.id === p.id ? data.promotion : x))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo & Voucher</h1>
          <p className="text-sm text-slate-500">
            Atur promo diskon, kode voucher, kuota, dan periode berlaku
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Buat Promo
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama Promo</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Diskon</th>
              <th className="px-4 py-3">Berlaku</th>
              <th className="px-4 py-3">Kuota</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.new_member_only && (
                    <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">
                      Member Baru
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold">
                  {p.code || "-"}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">
                  {p.discount_type === "percent"
                    ? `${p.discount_value}%`
                    : formatRupiah(p.discount_value)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateId(p.start_date)} – {formatDateId(p.end_date)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.max_quota ?? "∞"} (maks {p.max_per_member ?? "∞"}/member)
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className="rounded border px-2.5 py-1 text-xs"
                  >
                    {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Buat Promo / Voucher</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Nama Promo</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Kode Voucher (Opsional)
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CONTOH20"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium">Tipe Diskon</label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as DiscountType)
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="percent">Persen (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Nilai</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Berlaku Untuk</label>
                  <select
                    value={appliesTo}
                    onChange={(e) =>
                      setAppliesTo(
                        e.target.value as "all" | "package" | "product"
                      )
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="all">Semua</option>
                    <option value="package">Paket Membership</option>
                    <option value="product">Produk POS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Kuota Total</label>
                  <input
                    type="number"
                    min={1}
                    value={maxQuota}
                    onChange={(e) => setMaxQuota(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Batas per Member
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxPerMember}
                    onChange={(e) => setMaxPerMember(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newMemberOnly}
                  onChange={(e) => setNewMemberOnly(e.target.checked)}
                />
                Khusus pendaftaran member baru
              </label>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
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
