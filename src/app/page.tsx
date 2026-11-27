import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  MessageCircle,
  PauseCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/session";
import { buildWhatsAppUrl, formatRupiah } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

const SAAS_PLANS = [
  {
    name: "Starter",
    badge: "Gym Pemula",
    monthlyPrice: 149000,
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
    monthlyPrice: 299000,
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
    monthlyPrice: 599000,
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

export default async function GymMateLandingPage() {
  const staff = await getCurrentStaff();

  const features = [
    {
      icon: QrCode,
      title: "Presensi QR Code & ID Manual",
      desc: "Check-in member selesai < 5 detik lewat kamera/scanner USB, atau input ID Member singkat jika QR tidak terbaca.",
    },
    {
      icon: ShieldCheck,
      title: "Shift Kasir Anti Selisih",
      desc: "Setiap transaksi & pengeluaran tunai tercatat ke shift kasir. Selisih kas langsung terlacak saat tutup shift.",
    },
    {
      icon: ShoppingBag,
      title: "POS Produk & Kontrol Stok",
      desc: "Jual minuman, suplemen, merchandise & sewa handuk dengan barcode scanner, lengkap dengan HPP dan stok minimum.",
    },
    {
      icon: BarChart3,
      title: "Laporan Laba Rugi Otomatis",
      desc: "Pantau pendapatan membership, tiket harian, produk POS, dikurangi modal produk & pengeluaran secara real-time.",
    },
    {
      icon: PauseCircle,
      title: "Freeze, Promo & Referral",
      desc: "Kelola cuti membership otomatis, buat kode voucher berkuota, dan jalankan program referral member ajak teman.",
    },
    {
      icon: CalendarDays,
      title: "Personal Trainer, Kelas & Komisi",
      desc: "Atur jadwal kelas grup berkuota, sesi PT, dan hitung komisi trainer otomatis tanpa rekap manual.",
    },
    {
      icon: Users,
      title: "Portal Member & QRIS Mandiri",
      desc: "Member bisa cek QR Code, sisa masa aktif, dan perpanjang paket mandiri dari HP tanpa antre di kasir.",
    },
    {
      icon: Building2,
      title: "Multi-Cabang & Turnstile",
      desc: "Kelola banyak cabang dalam satu dashboard owner serta integrasi webhook pintu otomatis saat check-in berhasil.",
    },
  ];

  const waSalesUrl = buildWhatsAppUrl(
    "081299998888",
    "Halo tim Gym Mate, saya pemilik gym dan ingin konsultasi langganan platform Gym Mate."
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-white">
                Gym Mate
              </p>
              <p className="text-[11px] text-slate-400">
                Platform Manajemen Gym & Fitness
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#masalah" className="hover:text-white">
              Solusi
            </a>
            <a href="#fitur" className="hover:text-white">
              Semua Fitur
            </a>
            <a href="#harga" className="hover:text-white">
              Harga Langganan
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {staff ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Buka Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Coba Demo Aplikasi <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Platform SaaS Manajemen Gym #1 untuk Owner & Kasir
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Kelola Bisnis Gym Lebih Rapi Bersama{" "}
            <span className="text-emerald-400">Gym Mate</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            Tinggalkan buku catatan, Excel, dan rekap manual. Pantau member
            aktif, presensi QR/ID, shift kasir anti selisih, POS produk, hingga
            laba rugi gym Anda dari satu sistem terpusat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Coba Demo Interaktif (Owner / Kasir)
            </Link>
            <a
              href="#harga"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Lihat Harga Langganan
            </a>
            <a
              href={waSalesUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Hubungi Tim Gym Mate
            </a>
          </div>
        </div>
      </section>

      {/* Masalah yang Diselesaikan */}
      <section id="masalah" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:grid-cols-4">
          {[
            {
              title: "Member Aktif Jelas",
              desc: "Owner tahu persis jumlah member aktif, akan habis, dan churn tanpa hitung manual.",
            },
            {
              title: "Presensi < 5 Detik",
              desc: "Kasir cukup scan QR atau ketik ID Member. Member habis otomatis ditolak.",
            },
            {
              title: "Uang Kas Terlacak 100%",
              desc: "Setiap transaksi & pengeluaran tunai terikat ke shift kasir. Tidak ada selisih tanpa jejak.",
            },
            {
              title: "Perpanjangan Naik",
              desc: "Pengingat WhatsApp H-7 & Portal Member mandiri bikin member rajin perpanjang.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="text-base font-bold text-emerald-400">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Semua Fitur Platform */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Semua Fitur di Platform Gym Mate
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Lengkap untuk operasional front-desk kasir, kontrol owner, dan
            kenyamanan member
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-emerald-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Harga Langganan SaaS Bulanan */}
      <section
        id="harga"
        className="border-y border-slate-800 bg-slate-900/50 px-4 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Harga Langganan Bulanan Gym Mate
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Investasi terjangkau untuk menghemat puluhan jam rekap manual &
              mencegah kebocoran kas
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {SAAS_PLANS.map((plan) => {
              const waOrder = buildWhatsAppUrl(
                "081299998888",
                `Halo Gym Mate, saya ingin berlangganan paket ${plan.name} (${formatRupiah(plan.monthlyPrice)}/bulan) untuk gym saya.`
              );
              return (
                <div
                  key={plan.name}
                  className={`flex flex-col justify-between rounded-3xl border p-7 ${
                    plan.popular
                      ? "border-emerald-500 bg-slate-900 shadow-xl shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-900/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">
                        {plan.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          plan.popular
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-emerald-400">
                        {formatRupiah(plan.monthlyPrice)}
                      </span>
                      <span className="text-xs text-slate-400">/ bulan</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Bayar tahunan hemat 2 bulan (10x harga bulanan)
                    </p>
                    <p className="mt-4 text-sm text-slate-300">{plan.desc}</p>

                    <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
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
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "bg-slate-800 text-white hover:bg-slate-700"
                      }`}
                    >
                      Pilih Paket {plan.name}
                    </a>
                    <Link
                      href="/login"
                      className="block rounded-xl border border-slate-700 py-2 text-center text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Coba Demo Gratis
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              Gym Mate
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Platform Manajemen Gym Modern untuk Owner, Kasir & Member
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
            >
              <CreditCard className="h-4 w-4" />
              Masuk ke Demo Aplikasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
