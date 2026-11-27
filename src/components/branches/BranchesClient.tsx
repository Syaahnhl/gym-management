"use client";

import { useState } from "react";
import type { Branch } from "@/types/database";

export function BranchesClient({
  initialBranches,
}: {
  initialBranches: Branch[];
}) {
  const [branches, setBranches] = useState(initialBranches);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, phone }),
    });
    const d = await res.json();
    if (res.ok) {
      setBranches((prev) => [...prev, d.branch]);
      setName("");
      setAddress("");
      setPhone("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cabang Gym</h1>
        <p className="text-sm text-slate-500">
          Kelola lokasi cabang gym (Multi-Branch)
        </p>
      </div>

      <form
        onSubmit={addBranch}
        className="grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-4"
      >
        <input
          required
          placeholder="Nama Cabang"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Alamat"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          placeholder="No. Telepon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          + Tambah Cabang
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((b) => (
          <div key={b.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">{b.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{b.address}</p>
            <p className="mt-1 text-xs text-slate-500">{b.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
