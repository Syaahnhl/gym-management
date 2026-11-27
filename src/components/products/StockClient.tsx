"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product, StockMovement } from "@/types/database";
import { formatDateTimeWib } from "@/lib/domain/format";

type MovementRow = StockMovement & { product_name: string; user_name: string };

export function StockClient({
  initialProducts,
  initialMovements,
}: {
  initialProducts: Product[];
  initialMovements: MovementRow[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [productId, setProductId] = useState(initialProducts[0]?.id || "");
  const [type, setType] = useState<"in" | "adjustment">("in");
  const [qty, setQty] = useState(10);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        type,
        qty: Number(qty),
        reason,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan mutasi stok");
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? data.product : p))
    );
    setReason("");
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Stok</h1>
        <p className="text-sm text-slate-500">
          Catat stok masuk dari supplier dan penyesuaian stok (rusak/hilang/opname)
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-5"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">
            Produk
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stok: {p.stock})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Jenis Mutasi
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "in" | "adjustment")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="in">Stok Masuk (+)</option>
            <option value="adjustment">Penyesuaian (+/-)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Jumlah
          </label>
          <input
            type="number"
            required
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Simpan
          </button>
        </div>
        <div className="sm:col-span-5">
          <label className="block text-xs font-medium text-slate-600">
            Alasan / Keterangan *
          </label>
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Restock supplier ABC / Barang rusak 2 pcs"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="sm:col-span-5 text-sm text-rose-600">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Oleh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialMovements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateTimeWib(m.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {m.product_name}
                </td>
                <td className="px-4 py-3 uppercase text-xs">{m.type}</td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    m.qty > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                </td>
                <td className="px-4 py-3 text-slate-600">{m.reason || "-"}</td>
                <td className="px-4 py-3 text-slate-500">{m.user_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
