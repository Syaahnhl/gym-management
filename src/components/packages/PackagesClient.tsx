"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Package, PackageType } from "@/types/database";
import { formatRupiah } from "@/lib/domain/format";

export function PackagesClient({
  initialPackages,
}: {
  initialPackages: Package[];
}) {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<PackageType>("membership");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(350000);
  const [regFee, setRegFee] = useState(100000);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setType("membership");
    setDurationDays(30);
    setPrice(350000);
    setRegFee(100000);
    setDescription("");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setName(pkg.name);
    setType(pkg.type);
    setDurationDays(pkg.duration_days);
    setPrice(pkg.price);
    setRegFee(pkg.registration_fee);
    setDescription(pkg.description);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name,
      type,
      duration_days: Number(durationDays),
      price: Number(price),
      registration_fee: Number(regFee),
      description,
    };

    const res = await fetch(
      editing ? `/api/packages/${editing.id}` : "/api/packages",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan paket");
      return;
    }

    if (editing) {
      setPackages((prev) =>
        prev.map((p) => (p.id === editing.id ? data.package : p))
      );
    } else {
      setPackages((prev) => [...prev, data.package]);
    }
    setModalOpen(false);
  }

  async function toggleActive(pkg: Package) {
    const res = await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    const data = await res.json();
    if (res.ok) {
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? data.package : p))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paket Membership</h1>
          <p className="text-sm text-slate-500">
            Kelola paket membership dan tiket harian (perubahan harga tidak
            mengubah transaksi lama)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Paket
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama Paket</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Biaya Daftar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <div>{pkg.name}</div>
                  {pkg.description && (
                    <div className="text-xs text-slate-500">{pkg.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {pkg.type === "membership" ? "Membership" : "Harian"}
                </td>
                <td className="px-4 py-3">{pkg.duration_days} hari</td>
                <td className="px-4 py-3 font-semibold">
                  {formatRupiah(pkg.price)}
                </td>
                <td className="px-4 py-3">{formatRupiah(pkg.registration_fee)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pkg.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {pkg.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(pkg)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(pkg)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
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
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Paket" : "Tambah Paket Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Paket
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tipe
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PackageType)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="membership">Membership</option>
                    <option value="daily">Harian (Walk-in)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Durasi (hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Biaya Pendaftaran (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={regFee}
                    onChange={(e) => setRegFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
