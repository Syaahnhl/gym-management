"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Product, ProductCategory } from "@/types/database";
import { PRODUCT_CATEGORY_LABELS, formatRupiah } from "@/lib/domain/format";

export function ProductsClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("minuman");
  const [sku, setSku] = useState("");
  const [sellPrice, setSellPrice] = useState(10000);
  const [costPrice, setCostPrice] = useState(5000);
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(5);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setCategory("minuman");
    setSku("");
    setSellPrice(10000);
    setCostPrice(5000);
    setStock(10);
    setMinStock(5);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku || "");
    setSellPrice(p.sell_price);
    setCostPrice(p.cost_price);
    setStock(p.stock);
    setMinStock(p.min_stock);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name,
      category,
      sku: sku.trim() || null,
      sell_price: Number(sellPrice),
      cost_price: Number(costPrice),
      ...(editing ? {} : { stock: Number(stock) }),
      min_stock: Number(minStock),
    };
    const res = await fetch(
      editing ? `/api/products/${editing.id}` : "/api/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan produk");
      return;
    }
    if (editing) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? data.product : p))
      );
    } else {
      setProducts((prev) => [...prev, data.product]);
    }
    setModalOpen(false);
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    const data = await res.json();
    if (res.ok) {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? data.product : x))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produk POS</h1>
          <p className="text-sm text-slate-500">
            Kelola produk minuman, suplemen, merchandise, dan sewa handuk/loker
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Harga Jual</th>
              <th className="px-4 py-3">Harga Modal</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {PRODUCT_CATEGORY_LABELS[p.category]}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {p.sku || "-"}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatRupiah(p.sell_price)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatRupiah(p.cost_price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-semibold ${
                      p.stock <= p.min_stock ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {p.stock}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">
                    (min {p.min_stock})
                  </span>
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
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
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
            <h2 className="text-lg font-bold">
              {editing ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Nama Produk</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="minuman">Minuman</option>
                    <option value="suplemen">Suplemen</option>
                    <option value="merchandise">Merchandise</option>
                    <option value="sewa">Sewa Handuk/Loker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">SKU / Barcode</label>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium">Stok Awal</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium">Stok Minimum</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
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
