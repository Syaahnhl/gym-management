"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { buildWhatsAppUrl, formatRupiah } from "@/lib/domain/format";

export const GYMMATE_PLANS = [
  {
    name: "Starter",
    badge: "Gym Pemula",
    monthly: 149000,
    desc: "Cocok untuk gym skala kecil yang ingin beralih dari pencatatan buku & Excel.",
    popular: false,
    features: [
      "1 Lokasi / Cabang",
      "1 Akun Owner + 2 Kasir",
      "Hingga 500 Member Aktif",
      "Presensi QR Code & ID Manual",
      "Shift Kasir & Rekap Kas Harian",
      "Pengingat WhatsApp (wa.me)",
      "Portal Member Pribadi",
    ],
  },
  {
    name: "Pro",
    badge: "Terpopuler",
    monthly: 299000,
    desc: "Solusi lengkap untuk gym berkembang dengan kontrol keuangan & stok penuh.",
    popular: true,
    features: [
      "1 Lokasi / Cabang",
      "1 Akun Owner + 5 Kasir",
      "Hingga 2.000 Member Aktif",
      "Semua fitur Starter",
      "POS Produk, Barcode & Manajemen Stok",
      "Freeze / Cuti, Promo Voucher & Referral",
      "Personal Trainer, Kelas & Komisi",
      "Laporan Laba Rugi & Ekspor Excel/CSV",
      "Perpanjangan Mandiri QRIS (Payment Gateway)",
    ],
  },
  {
    name: "Enterprise",
    badge: "Multi-Cabang",
    monthly: 599000,
    desc: "Untuk jaringan gym & studio fitness dengan banyak cabang dan otomasi penuh.",
    popular: false,
    features: [
      "Multi-Cabang Tak Terbatas",
      "Akun Kasir & Member Unlimited",
      "Semua fitur Pro",
      "WhatsApp API Otomatis (Fonnte/Wablas)",
      "Integrasi Turnstile / Pintu Otomatis",
      "Laporan Konsolidasi Laba Rugi per Cabang",
      "Prioritas Support & Onboarding Tim",
    ],
  },
];

const FAQS = [
  {
    q: "Apakah harus beli mesin scanner khusus untuk presensi QR?",
    a: "Tidak wajib. GymMate mendukung kamera laptop/HP/tablet bawaan untuk scan QR, scanner USB biasa, maupun presensi manual lewat ID Member (misal GYM-00001 atau angka 1) jika QR member tidak terbaca.",
  },
  {
    q: "Bagaimana jika kasir salah input transaksi?",
    a: "Kasir tidak bisa menghapus atau mengedit transaksi yang sudah tersimpan demi keamanan kas. Hanya Owner yang bisa melakukan Void dengan alasan tercatat, dan masa aktif/stok otomatis dihitung ulang.",
  },
  {
    q: "Apakah bisa import data member dari Excel?",
    a: "Bisa. Tim onboarding GymMate membantu migrasi data member aktif dan tanggal habis dari Excel Anda agar langsung siap pakai di hari pertama.",
  },
  {
    q: "Bagaimana cara mencoba demo aplikasinya sekarang?",
    a: "Klik tombol 'Coba Demo Live', lalu pilih login cepat sebagai Owner (owner@ironpeak.id) atau Kasir 1 (kasir1@ironpeak.id) dengan password gym123456.",
  },
];

export function PricingAndFaqSection({
  onTryDemo,
}: {
  onTryDemo?: () => void;
}) {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section
        id="harga"
        className="border-y border-blue-100 bg-blue-50/50 px-4 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
              Harga Transparan
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Pilih Paket Langganan GymMate
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tanpa biaya tersembunyi. Mulai dari Rp 5.000-an/hari untuk
              mengamankan kas & meningkatkan perpanjangan member.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  !annual
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-700"
                }`}
              >
                Bayar Bulanan
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  annual
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-700"
                }`}
              >
                Tahunan (Hemat 2 Bulan)
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {GYMMATE_PLANS.map((plan) => {
              const displayPrice = annual
                ? Math.round((plan.monthly * 10) / 12)
                : plan.monthly;
              const waOrder = buildWhatsAppUrl(
                "081299998888",
                `Halo GymMate, saya ingin berlangganan paket ${plan.name} (${
                  annual ? "Tahunan" : "Bulanan"
                } ${formatRupiah(displayPrice)}/bulan) untuk gym saya.`
              );
              return (
                <div
                  key={plan.name}
                  className={`flex flex-col justify-between rounded-3xl border bg-white p-7 transition ${
                    plan.popular
                      ? "border-2 border-blue-600 shadow-2xl shadow-blue-600/15"
                      : "border-blue-100 shadow-sm hover:border-blue-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">
                        {plan.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          plan.popular
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-blue-600">
                        {formatRupiah(displayPrice)}
                      </span>
                      <span className="text-xs text-slate-500">/ bulan</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {annual
                        ? `Ditagih ${formatRupiah(plan.monthly * 10)} per tahun (gratis 2 bulan)`
                        : "Tagihan per bulan, bisa upgrade kapan saja"}
                    </p>
                    <p className="mt-4 text-sm text-slate-600">{plan.desc}</p>

                    <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 space-y-2">
                    <a
                      href={waOrder}
                      target="_blank"
                      rel="noreferrer"
                      className={`block rounded-xl py-2.5 text-center text-sm font-bold transition ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      Pilih Paket {plan.name}
                    </a>
                    {onTryDemo ? (
                      <button
                        type="button"
                        onClick={onTryDemo}
                        className="block w-full rounded-xl border border-blue-200 bg-white py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Coba Demo Gratis
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className="block rounded-xl border border-blue-200 bg-white py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Coba Demo Gratis
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Pertanyaan Umum (FAQ)
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hal yang paling sering ditanyakan pemilik gym sebelum memakai GymMate
          </p>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-blue-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-slate-900"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-blue-600 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-blue-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
