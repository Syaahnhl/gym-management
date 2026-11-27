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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight tracking-tight text-white">
                GymMate
              </p>
              <p className="text-[11px] text-slate-400">
                Platform Manajemen Gym Modern
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#perbandingan" className="hover:text-white">
              Solusi
            </a>
            <a href="#fitur" className="hover:text-white">
              Fitur
            </a>
            <a href="#harga" className="hover:text-white">
              Harga
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={staff ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              {staff ? "Buka Dashboard" : "Coba Demo Live"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Product Mockup */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Platform SaaS Manajemen Gym untuk Owner & Front-Desk
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:leading-[1.12]">
              Kelola Bisnis Gym Tanpa Drama{" "}
              <span className="text-emerald-400">Selisih Kas</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              <strong>GymMate</strong> menggantikan buku catatan, Excel, dan
              rekap WhatsApp manual. Pantau member aktif, presensi QR/ID kurang
              dari 5 detik, POS produk, hingga laba rugi bersih secara
              real-time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Coba Demo Live Gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#harga"
                className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Lihat Harga Bulanan
              </a>
              <a
                href={waSalesUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Konsultasi WA
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-6">
              <div>
                <p className="text-2xl font-extrabold text-white">&lt; 5 dtk</p>
                <p className="text-xs text-slate-400">Presensi QR & ID</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-400">100%</p>
                <p className="text-xs text-slate-400">Kas Shift Terlacak</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">2.000+</p>
                <p className="text-xs text-slate-400">Member per Cabang</p>
              </div>
            </div>
          </div>

          {/* Interactive-style SaaS Dashboard Mockup */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-emerald-500/10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  app.gymmate.id/dashboard
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <p className="text-[11px] text-slate-400">
                    Pendapatan Bulan Ini
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-400">
                    Rp 42.850.000
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <p className="text-[11px] text-slate-400">Member Aktif</p>
                  <p className="mt-1 text-lg font-extrabold text-sky-400">
                    384 orang
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Presensi Berhasil · GYM-00012
                      </p>
                      <p className="text-[11px] text-emerald-200">
                        Andi Pratama · Sisa 21 hari aktif
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    AKTIF
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs">
                <span className="text-slate-400">Shift Kasir Pagi (Siti)</span>
                <span className="font-semibold text-emerald-400">
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
          <h2 className="text-3xl font-bold text-white">
            Kenapa Pemilik Gym Beralih ke GymMate?
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Bandingkan operasional harian sebelum dan sesudah memakai GymMate
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-7">
            <h3 className="text-lg font-bold text-rose-300">
              Cara Lama (Buku / Excel / Chat WA)
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                "Owner tidak tahu pasti berapa member aktif & omzet riil hari ini",
                "Kasir kewalahan cek member aktif atau sudah habis di Excel",
                "Uang kas tunai sering selisih tanpa jejak transaksi",
                "Member lupa masa aktif habis karena tidak ada pengingat rutin",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-2.5">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/15 p-7">
            <h3 className="text-lg font-bold text-emerald-300">
              Dengan Platform GymMate
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {[
                "Dashboard owner real-time: omzet, member baru, churn, & laba rugi",
                "Presensi QR & ID manual < 5 detik, otomatis tolak member habis",
                "Tutup shift kasir menghitung kas seharusnya & mewajibkan catatan selisih",
                "Pengingat WhatsApp H-7 + Portal Member mandiri untuk perpanjang QRIS",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
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
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <p className="text-sm font-extrabold text-emerald-400">
                {r.role}
              </p>
              <p className="mt-2 text-sm text-slate-300">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Semua Fitur Platform */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Semua Fitur di Platform GymMate
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Satu aplikasi web responsif untuk laptop, tablet kasir, dan HP
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

      {/* Harga Langganan + FAQ */}
      <PricingAndFaqSection />

      {/* Final CTA Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 to-slate-900 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Siap Merapikan Operasional Gym Anda?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Coba langsung seluruh fitur GymMate lewat demo interaktif sekarang,
            atau hubungi tim kami untuk setup gym Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
            >
              Coba Demo Live Sekarang
            </Link>
            <a
              href={waSalesUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Chat Tim GymMate
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              GymMate
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Platform Manajemen Gym Modern untuk Owner, Kasir & Member
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
          >
            <CreditCard className="h-4 w-4" />
            Masuk ke Demo Aplikasi
          </Link>
        </div>
      </footer>
    </div>
  );
}
