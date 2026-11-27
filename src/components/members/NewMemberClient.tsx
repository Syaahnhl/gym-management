"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Member, Package, PaymentMethod, StaffRole } from "@/types/database";
import { formatRupiah } from "@/lib/domain/format";
import { addDaysToDateStr } from "@/lib/domain/membership";

export function NewMemberClient({
  packages,
  staffRole,
  maxCashierDiscount,
  todayStr,
}: {
  packages: Package[];
  staffRole: StaffRole;
  maxCashierDiscount: number;
  todayStr: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"L" | "P">("L");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [startDate, setStartDate] = useState(todayStr);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [existingMember, setExistingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPkg = packages.find((p) => p.id === packageId);
  const subtotal = (selectedPkg?.price ?? 0) + (selectedPkg?.registration_fee ?? 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const changeAmount =
    paymentMethod === "cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0;
  const maxStartDate = addDaysToDateStr(todayStr, 7);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistingMember(null);
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "registration",
          memberData: {
            full_name: fullName,
            phone,
            email: email || null,
            gender,
            birth_date: birthDate || null,
            address: address || null,
            id_number: idNumber || null,
            emergency_contact: emergencyContact || null,
            notes: notes || null,
          },
          packageId,
          startDate,
          discount: Number(discount || 0),
          discountReason: discountReason || undefined,
          promoCode: promoCode.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          paymentMethod,
          cashReceived:
            paymentMethod === "cash" ? Number(cashReceived || 0) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan pendaftaran");
        if (data.existingMember) {
          setExistingMember(data.existingMember);
        }
        return;
      }
      router.push(`/transactions/${data.transaction.id}`);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pendaftaran Member Baru
        </h1>
        <p className="text-sm text-slate-500">
          Isi data diri, pilih paket membership, dan catat pembayaran sekaligus
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-bold text-slate-900">Data Member</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Nama Lengkap *
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nomor HP (WhatsApp) *
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "L" | "P")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email (Opsional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nomor KTP (Opsional)
              </label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Kontak Darurat
              </label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Alamat
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Catatan
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900">
            Paket & Pembayaran
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Pilih Paket Membership *
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.duration_days} hr) - {formatRupiah(p.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tanggal Mulai (maks +7 hari)
            </label>
            <input
              type="date"
              min={todayStr}
              max={maxStartDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Kode Promo / Voucher (Opsional)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Contoh: BARU20"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  setPromoMsg(null);
                  const res = await fetch("/api/promotions/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      promoCode,
                      isNewMember: true,
                      packageId,
                      subtotal,
                    }),
                  });
                  const d = await res.json();
                  if (!res.ok) {
                    setPromoMsg(d.error || "Kode tidak berlaku");
                    return;
                  }
                  setDiscount(d.discountAmount);
                  setDiscountReason(`Promo: ${d.promotion.name}`);
                  setPromoMsg(`Promo "${d.promotion.name}" diterapkan (-${formatRupiah(d.discountAmount)})`);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
              >
                Cek
              </button>
            </div>
            {promoMsg && <p className="mt-1 text-xs text-emerald-700">{promoMsg}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Kode Referral Member (Opsional)
            </label>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Contoh: REF-00001"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Diskon (Rp){" "}
              {staffRole === "cashier" && (
                <span className="text-xs text-slate-400">
                  (maks {formatRupiah(maxCashierDiscount)})
                </span>
              )}
            </label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {discount > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Alasan Diskon *
              </label>
              <input
                required
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer Bank</option>
              <option value="card">Kartu Debit/Kredit (EDC)</option>
            </select>
          </div>

          {paymentMethod === "cash" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Uang Diterima (Rp) *
              </label>
              <input
                type="number"
                min={total}
                required
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Kembalian:{" "}
                <strong className="text-slate-900">
                  {formatRupiah(changeAmount)}
                </strong>
              </p>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Harga Paket</span>
              <span>{formatRupiah(selectedPkg?.price ?? 0)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya Pendaftaran</span>
              <span>{formatRupiah(selectedPkg?.registration_fee ?? 0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total Bayar</span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p>{error}</p>
              {existingMember && (
                <Link
                  href={`/members/${existingMember.id}`}
                  className="mt-1 inline-block font-semibold underline"
                >
                  Lihat Member Terdaftar ({existingMember.member_code}) →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan & Proses Pembayaran"}
          </button>
        </div>
      </form>
    </div>
  );
}
