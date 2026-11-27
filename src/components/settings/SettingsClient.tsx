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
  const [freezeAllowed, setFreezeAllowed] = useState(
    initialSettings.freeze_allowed
  );
  const [freezeMinDays, setFreezeMinDays] = useState(
    initialSettings.freeze_min_days
  );
  const [freezeMaxDays, setFreezeMaxDays] = useState(
    initialSettings.freeze_max_days
  );
  const [freezeMaxPerPeriod, setFreezeMaxPerPeriod] = useState(
    initialSettings.freeze_max_days_per_period
  );
  const [freezeFee, setFreezeFee] = useState(initialSettings.freeze_fee);
  const [cashierCanExpense, setCashierCanExpense] = useState(
    initialSettings.cashier_can_record_expense
  );
  const [referralEnabled, setReferralEnabled] = useState(
    initialSettings.referral_enabled
  );
  const [referralDiscount, setReferralDiscount] = useState(
    initialSettings.referral_discount_amount
  );
  const [referralRewardType, setReferralRewardType] = useState(
    initialSettings.referral_reward_type
  );
  const [referralRewardValue, setReferralRewardValue] = useState(
    initialSettings.referral_reward_value
  );
  const [pgProvider, setPgProvider] = useState(
    initialSettings.payment_gateway_provider || "midtrans"
  );
  const [autoWa, setAutoWa] = useState(
    initialSettings.auto_wa_enabled || false
  );
  const [waProvider, setWaProvider] = useState(
    initialSettings.wa_api_provider || "fonnte"
  );
  const [waToken, setWaToken] = useState(initialSettings.wa_api_token || "");
  const [turnstileEnabled, setTurnstileEnabled] = useState(
    initialSettings.turnstile_enabled || false
  );
  const [turnstileUrl, setTurnstileUrl] = useState(
    initialSettings.turnstile_webhook_url || ""
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
        freeze_allowed: freezeAllowed,
        freeze_min_days: Number(freezeMinDays),
        freeze_max_days: Number(freezeMaxDays),
        freeze_max_days_per_period: Number(freezeMaxPerPeriod),
        freeze_fee: Number(freezeFee),
        cashier_can_record_expense: cashierCanExpense,
        referral_enabled: referralEnabled,
        referral_discount_amount: Number(referralDiscount),
        referral_reward_type: referralRewardType,
        referral_reward_value: Number(referralRewardValue),
        payment_gateway_provider: pgProvider,
        auto_wa_enabled: autoWa,
        wa_api_provider: waProvider,
        wa_api_token: waToken || null,
        turnstile_enabled: turnstileEnabled,
        turnstile_webhook_url: turnstileUrl || null,
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

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Pengaturan Freeze / Cuti Membership
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={freezeAllowed}
              onChange={(e) => setFreezeAllowed(e.target.checked)}
              className="rounded border-slate-300"
            />
            Izinkan pengajuan freeze membership
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Min. Hari per Pengajuan
              </label>
              <input
                type="number"
                min={1}
                value={freezeMinDays}
                onChange={(e) => setFreezeMinDays(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Maks. Hari per Pengajuan
              </label>
              <input
                type="number"
                min={1}
                value={freezeMaxDays}
                onChange={(e) => setFreezeMaxDays(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Maks. Total Hari per Periode
              </label>
              <input
                type="number"
                min={1}
                value={freezeMaxPerPeriod}
                onChange={(e) => setFreezeMaxPerPeriod(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Biaya Freeze (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={freezeFee}
                onChange={(e) => setFreezeFee(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 pt-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cashierCanExpense}
              onChange={(e) => setCashierCanExpense(e.target.checked)}
              className="rounded border-slate-300"
            />
            Izinkan kasir mencatat pengeluaran operasional
          </label>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Pengaturan Program Referral
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={referralEnabled}
              onChange={(e) => setReferralEnabled(e.target.checked)}
              className="rounded border-slate-300"
            />
            Aktifkan program referral member
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Diskon Member Baru (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={referralDiscount}
                onChange={(e) => setReferralDiscount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Tipe Bonus Pengajak
              </label>
              <select
                value={referralRewardType}
                onChange={(e) =>
                  setReferralRewardType(
                    e.target.value as "days" | "discount_balance"
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="days">Tambahan Hari Aktif</option>
                <option value="discount_balance">Saldo Diskon (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Nilai Bonus ({referralRewardType === "days" ? "Hari" : "Rp"})
              </label>
              <input
                type="number"
                min={0}
                value={referralRewardValue}
                onChange={(e) => setReferralRewardValue(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Integrasi Payment Gateway, WhatsApp API & Turnstile
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Payment Gateway
              </label>
              <select
                value={pgProvider}
                onChange={(e) =>
                  setPgProvider(e.target.value as "none" | "midtrans" | "xendit")
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="midtrans">Midtrans (QRIS / VA)</option>
                <option value="xendit">Xendit</option>
                <option value="none">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Provider WhatsApp API
              </label>
              <select
                value={waProvider}
                onChange={(e) =>
                  setWaProvider(
                    e.target.value as "none" | "fonnte" | "wablas" | "cloud_api"
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="fonnte">Fonnte</option>
                <option value="wablas">Wablas</option>
                <option value="cloud_api">WhatsApp Cloud API</option>
                <option value="none">Nonaktif</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={autoWa}
              onChange={(e) => setAutoWa(e.target.checked)}
            />
            Aktifkan pengiriman WhatsApp API otomatis
          </label>
          <input
            placeholder="Token WhatsApp API (Opsional)"
            value={waToken}
            onChange={(e) => setWaToken(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={turnstileEnabled}
              onChange={(e) => setTurnstileEnabled(e.target.checked)}
            />
            Aktifkan integrasi Turnstile / Pintu Otomatis saat Check-in
          </label>
          <input
            placeholder="Webhook URL Controller Turnstile (http://192.168.1.50/open)"
            value={turnstileUrl}
            onChange={(e) => setTurnstileUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
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
