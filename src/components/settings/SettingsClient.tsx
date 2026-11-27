"use client";

import { useState } from "react";
import type { GymSettings } from "@/types/database";

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: GymSettings;
}) {
  const [name, setName] = useState(initialSettings.name);
  const [address, setAddress] = useState(initialSettings.address);
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.whatsapp_number
  );
  const [reminderDays, setReminderDays] = useState(initialSettings.reminder_days);
  const [reminderTemplate, setReminderTemplate] = useState(
    initialSettings.reminder_template
  );
  const [maxDiscount, setMaxDiscount] = useState(
    initialSettings.max_cashier_discount
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        whatsapp_number: whatsappNumber,
        reminder_days: Number(reminderDays),
        reminder_template: reminderTemplate,
        max_cashier_discount: Number(maxDiscount),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan pengaturan");
      return;
    }
    setSavedMsg("Pengaturan gym berhasil disimpan.");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Gym</h1>
        <p className="text-sm text-slate-500">
          Profil gym, batas diskon kasir, dan template pengingat WhatsApp
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nama Gym
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Alamat Gym
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nomor WhatsApp Gym
            </label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Batas Hari Pengingat (H-)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Batas Maksimal Diskon Kasir (Rp)
          </label>
          <input
            type="number"
            min={0}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Template Pesan Pengingat WhatsApp
          </label>
          <textarea
            rows={4}
            value={reminderTemplate}
            onChange={(e) => setReminderTemplate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Variabel tersedia: <code>{"{nama}"}</code>,{" "}
            <code>{"{tanggal_habis}"}</code>, <code>{"{sisa_hari}"}</code>,{" "}
            <code>{"{nama_gym}"}</code>
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {savedMsg && <p className="text-sm text-emerald-600">{savedMsg}</p>}

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
