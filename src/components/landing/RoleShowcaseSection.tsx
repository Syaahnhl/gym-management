"use client";

import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  QrCode,
  Scale,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  XCircle,
} from "lucide-react";

type RoleKey = "owner" | "kasir" | "member";

const ROLE_TABS: Record<
  RoleKey,
  {
    label: string;
    title: string;
    subtitle: string;
    highlights: string[];
    badge: string;
  }
> = {
  owner: {
    label: "Panel Owner",
    title: "Pantau Omzet, Laba Rugi & Paket dari Satu Layar",
    subtitle:
      "Owner tidak perlu menunggu rekap Excel mingguan. Semua pemasukan membership, POS, dan pengeluaran operasional tercatat otomatis.",
    badge: "Kontrol Penuh Bisnis",
    highlights: [
      "Laporan Laba & Rugi real-time (omzet membership + POS dikurangi pengeluaran).",
      "Tambah & edit harga paket membership kapan saja tanpa mengganggu data lama.",
      "Pantau daftar member aktif, segera habis (H-7), cuti, dan reminder WhatsApp.",
      "Export laporan transaksi ke CSV untuk pembukuan bulanan.",
    ],
  },
  kasir: {
    label: "Panel Kasir",
    title: "Check-in < 5 Detik & Tutup Shift Anti Selisih",
    subtitle:
      "Front-desk cukup scan QR member atau ketik kode member, langsung bisa input berat badan & kelola transaksi produk POS.",
    badge: "Operasional Front-Desk",
    highlights: [
      "Scanner QR presensi dengan animasi verifikasi status aktif otomatis.",
      "Input cepat Berat Badan (BB) & Tinggi Badan langsung saat member datang.",
      "Kasir POS minuman, suplemen & sewa handuk dengan pengurangan stok otomatis.",
      "Perpanjang paket member atau catat member baru dalam hitungan detik.",
    ],
  },
  member: {
    label: "Portal Member QR",
    title: "Kartu QR Digital + Pantau Progres BB & BMI Harian",
    subtitle:
      "Member tidak perlu kartu fisik yang mudah hilang. Cukup buka Portal Member dari HP untuk absen dan melihat grafik progres tubuhnya.",
    badge: "Pengalaman Member Modern",
    highlights: [
      "Kartu QR digital pribadi dengan status keanggotaan & sisa hari aktif.",
      "Input Berat Badan & Tinggi Badan mandiri dengan kalkulasi BMI otomatis.",
      "Target BB & Progress Bar pencapaian agar member makin termotivasi.",
      "Grafik progres harian (BB & BMI) + log latihan yang tersimpan rapi.",
    ],
  },
};

const BEFORE_AFTER = [
  {
    aspek: "Presensi Masuk Member",
    before: "Tulis nama di buku absen atau cuma tunjukkan kartu ke penjaga.",
    after: "Scan QR Code < 5 detik, status aktif/expired terdeteksi otomatis.",
  },
  {
    aspek: "Pantau Progres Tubuh",
    before: "Tidak tercatat; member lupa perkembangan berat badan & BMI.",
    after: "Input BB & tinggi langsung, tampil grafik progres harian & target BB.",
  },
  {
    aspek: "Kasir & Shift",
    before: "Catatan kertas/Excel rawan selisih kas dan transaksi terlewat.",
    after: "Semua transaksi membership & POS tercatat rapi per metode bayar.",
  },
  {
    aspek: "Laporan Owner",
    before: "Harus rekap manual akhir bulan untuk tahu untung atau rugi.",
    after: "Dashboard omzet, pengeluaran, dan laba bersih tampil real-time.",
  },
];

const FAQS = [
  {
    q: "Apakah gym harus membeli mesin absen atau turnstile khusus?",
    a: "Tidak wajib. GymMate berjalan langsung di browser HP, tablet, atau laptop kasir menggunakan kamera/webcam maupun scanner USB biasa.",
  },
  {
    q: "Bagaimana jika member lupa membawa HP atau QR Code?",
    a: "Kasir tetap bisa melakukan check-in dengan mencari nama, nomor HP, atau kode member singkat (mis. GYM-00001) di panel Presensi.",
  },
  {
    q: "Apakah kasir bisa mengubah harga paket membership seenaknya?",
    a: "Tidak. Hak akses dipisahkan berdasarkan peran: hanya akun Owner yang dapat menambah, mengedit harga paket, serta melihat laporan Laba & Rugi.",
  },
  {
    q: "Bagaimana cara member memantau progres berat badan dan BMI?",
    a: "Member cukup membuka Portal Member QR dari HP masing-masing, lalu mengisi Berat Badan (kg) dan Tinggi Badan (cm). BMI, target, dan grafik progres harian langsung ter-update.",
  },
];

export function RoleShowcaseSection() {
  const [activeRole, setActiveRole] = useState<RoleKey>("owner");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const current = ROLE_TABS[activeRole];

  return (
    <>
      {/* Preview 3 Peran */}
      <section id="peran" className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            3 Peran Terintegrasi
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            Dirancang Khusus untuk Owner, Kasir & Member
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Setiap pengguna mendapatkan tampilan yang sesuai tugasnya — rapi, cepat, dan mudah dipahami.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {(
            [
              { key: "owner", label: "Panel Owner", icon: BarChart3 },
              { key: "kasir", label: "Panel Kasir", icon: ShoppingBag },
              { key: "member", label: "Portal Member QR", icon: QrCode },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveRole(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-white p-6 sm:p-8 shadow-xs">
          <div className="grid gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                {current.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {current.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {current.subtitle}
              </p>
            </div>
            <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
              {current.highlights.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-slate-700 leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section id="perbandingan-dampak" className="border-y border-slate-100 bg-slate-50/70 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Perbandingan: Cara Lama vs GymMate
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Dampak langsung setelah beralih dari pencatatan manual ke sistem digital GymMate.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BEFORE_AFTER.map((row) => (
              <div
                key={row.aspek}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  {row.aspek}
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-rose-50/70 border border-rose-100 p-3 text-xs text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sebelum:</strong> {row.before}
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dengan GymMate:</strong> {row.after}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Teknis */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Pertanyaan Umum
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            FAQ Implementasi Sistem
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
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
