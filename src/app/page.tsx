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
  XCircle,
} from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/session";
import { buildWhatsAppUrl } from "@/lib/domain/format";
import { PricingAndFaqSection } from "@/components/landing/PricingSection";
import { QrWorkflowShowcase } from "@/components/checkin/QrWorkflowShowcase";

export const dynamic = "force-dynamic";

export default async function GymMateLandingPage() {
  const staff = await getCurrentStaff();

  const features = [
    {
      icon: QrCode,
      title: "Presensi QR Code & ID Manual",
      desc: "Check-in member selesai < 5 detik lewat kamera/scanner USB, atau ketik ID Member singkat jika QR bermasalah.",
    },
    {
      icon: ShieldCheck,
      title: "Shift Kasir Anti Selisih",
      desc: "Setiap transaksi & pengeluaran tunai tercatat ke shift kasir. Selisih kas langsung terlacak saat tutup shift.",
    },
    {
      icon: ShoppingBag,
      title: "POS Produk & Kontrol Stok",
      desc: "Jual minuman, suplemen, merchandise & sewa handuk dengan barcode scanner, HPP, dan peringatan stok minimum.",
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
      desc: "Member bisa cek QR Code, ID Presensi, sisa masa aktif, dan perpanjang paket mandiri dari HP.",
    },
    {
      icon: Building2,
      title: "Multi-Cabang & Turnstile",
      desc: "Kelola banyak cabang dalam satu dashboard owner serta integrasi webhook pintu otomatis saat check-in.",
    },
  ];

  const waSalesUrl = buildWhatsAppUrl(
    "081299998888",
    "Halo tim GymMate, saya pemilik gym dan ingin konsultasi langganan platform GymMate."
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight tracking-tight text-slate-900">
                GymMate
              </p>
              <p className="text-[11px] text-slate-500">
                Platform Manajemen Gym Modern
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#perbandingan" className="hover:text-blue-600">
              Solusi
            </a>
            <a href="#fitur" className="hover:text-blue-600">
              Fitur
            </a>
            <a href="#harga" className="hover:text-blue-600">
              Harga
            </a>
            <a href="#faq" className="hover:text-blue-600">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={staff ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {staff ? "Buka Dashboard" : "Coba Demo Live"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Animated 3-Step QR Workflow Showcase */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Lihat Cara Kerjanya: Scan QR, Isi Progres BB/BMI, Selesai!
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Tanpa buku absen manual — cukup 3 langkah cepat di meja kasir.
          </p>
        </div>
        <QrWorkflowShowcase />
      </section>

      {/* Hero Section with Product Mockup */}
      <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-b from-blue-50/80 via-white to-white px-4 py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Platform SaaS Manajemen Gym untuk Owner & Front-Desk
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.12]">
              Kelola Bisnis Gym Tanpa Drama{" "}
              <span className="text-blue-600">Selisih Kas</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              <strong>GymMate</strong> menggantikan buku catatan, Excel, dan
              rekap WhatsApp manual. Pantau member aktif, presensi QR/ID kurang
              dari 5 detik, POS produk, hingga laba rugi bersih secara
              real-time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Coba Demo Live Gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#harga"
                className="rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Lihat Harga Bulanan
              </a>
              <a
                href={waSalesUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4 text-blue-600" />
                Konsultasi WA
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-blue-100 pt-6">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">&lt; 5 dtk</p>
                <p className="text-xs text-slate-500">Presensi QR & ID</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-blue-600">100%</p>
                <p className="text-xs text-slate-500">Kas Shift Terlacak</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">2.000+</p>
                <p className="text-xs text-slate-500">Member per Cabang</p>
              </div>
            </div>
          </div>

          {/* Interactive-style SaaS Dashboard Mockup */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-blue-200 bg-white p-5 shadow-2xl shadow-blue-600/10">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  app.gymmate.id/dashboard
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <p className="text-[11px] text-slate-500">
                    Pendapatan Bulan Ini
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-blue-600">
                    Rp 42.850.000
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <p className="text-[11px] text-slate-500">Member Aktif</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    384 orang
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-600 p-3.5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-5 w-5 text-blue-100" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Presensi Berhasil · GYM-00012
                      </p>
                      <p className="text-[11px] text-blue-100">
                        Andi Pratama · Sisa 21 hari aktif
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    AKTIF
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/40 px-3.5 py-2.5 text-xs">
                <span className="text-slate-600">Shift Kasir Pagi (Siti)</span>
                <span className="font-semibold text-blue-600">
                  Selisih: Rp 0 ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section id="perbandingan" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Kenapa Pemilik Gym Beralih ke GymMate?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Bandingkan operasional harian sebelum dan sesudah memakai GymMate
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
            <h3 className="text-lg font-bold text-slate-800">
              Cara Lama (Buku / Excel / Chat WA)
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                "Owner tidak tahu pasti berapa member aktif & omzet riil hari ini",
                "Kasir kewalahan cek member aktif atau sudah habis di Excel",
                "Uang kas tunai sering selisih tanpa jejak transaksi",
                "Member lupa masa aktif habis karena tidak ada pengingat rutin",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-2.5">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-7">
            <h3 className="text-lg font-bold text-blue-800">
              Dengan Platform GymMate
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                "Dashboard owner real-time: omzet, member baru, churn, & laba rugi",
                "Presensi QR & ID manual < 5 detik, otomatis tolak member habis",
                "Tutup shift kasir menghitung kas seharusnya & mewajibkan catatan selisih",
                "Pengingat WhatsApp H-7 + Portal Member mandiri untuk perpanjang QRIS",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Role Showcase */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              role: "Untuk Owner",
              desc: "Kontrol penuh harga paket, akun kasir, void transaksi, stok produk, komisi trainer, dan laporan laba rugi.",
            },
            {
              role: "Untuk Kasir Front-Desk",
              desc: "Daftar member baru < 3 menit, presensi QR/ID, jual minuman di POS, dan tutup shift tanpa ribet hitung manual.",
            },
            {
              role: "Untuk Member Gym",
              desc: "Akses Portal Member pribadi lewat HP: tampilkan QR Code, ID Presensi, cek sisa hari, dan perpanjang mandiri.",
            },
          ].map((r) => (
            <div
              key={r.role}
              className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-extrabold text-blue-600">
                {r.role}
              </p>
              <p className="mt-2 text-sm text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Semua Fitur Platform */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Semua Fitur di Platform GymMate
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Satu aplikasi web responsif untuk laptop, tablet kasir, dan HP
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Harga Langganan + FAQ */}
      <PricingAndFaqSection />

      {/* Final CTA Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center text-white shadow-xl shadow-blue-600/20 sm:p-12">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Siap Merapikan Operasional Gym Anda?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100">
            Coba langsung seluruh fitur GymMate lewat demo interaktif sekarang,
            atau hubungi tim kami untuk setup gym Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              Coba Demo Live Sekarang
            </Link>
            <a
              href={waSalesUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400 bg-blue-700/50 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800/60"
            >
              <MessageCircle className="h-4 w-4 text-white" />
              Chat Tim GymMate
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              GymMate
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Platform Manajemen Gym Modern untuk Owner, Kasir & Member
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <CreditCard className="h-4 w-4" />
            Masuk ke Demo Aplikasi
          </Link>
        </div>
      </footer>
    </div>
  );
}
