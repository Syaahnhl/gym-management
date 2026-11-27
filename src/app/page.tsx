import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  MapPin,
  MessageCircle,
  PauseCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentStaff } from "@/lib/auth/session";
import { getGymSettings, listPackages, listPromotions } from "@/lib/db/service";
import { listClasses, listTrainers } from "@/lib/db/phase2b-service";
import { buildWhatsAppUrl, formatDateId, formatRupiah } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function HomeProfilePage() {
  const staff = await getCurrentStaff();
  const settings = getGymSettings();
  const packages = listPackages(true);
  const trainers = listTrainers(true);
  const classes = listClasses().slice(0, 4);
  const promos = listPromotions(true).slice(0, 2);

  const features = [
    {
      icon: QrCode,
      title: "Presensi QR Code & ID Manual",
      desc: "Check-in super cepat kurang dari 5 detik dengan scan QR atau input ID member singkat jika QR tidak terbaca.",
    },
    {
      icon: Users,
      title: "Portal Member Mandiri",
      desc: "Setiap member punya link portal pribadi untuk lihat QR Code, sisa masa aktif, riwayat latihan, hingga perpanjangan mandiri QRIS.",
    },
    {
      icon: PauseCircle,
      title: "Freeze / Cuti Membership",
      desc: "Ajukan cuti saat sakit atau dinas luar kota. Masa aktif otomatis bertambah dan sisa hari kembali jika diakhiri lebih awal.",
    },
    {
      icon: Dumbbell,
      title: "Personal Trainer & Jadwal Kelas",
      desc: "Booking kelas grup (HIIT, Zumba, Yoga) dengan kuota otomatis serta jadwal sesi PT lengkap dengan perhitungan komisi.",
    },
    {
      icon: ShoppingBag,
      title: "POS Minuman, Suplemen & Stok",
      desc: "Kasir POS terintegrasi barcode scanner untuk penjualan minuman, suplemen, merchandise, dan sewa handuk/loker.",
    },
    {
      icon: BarChart3,
      title: "Shift Kasir, Laba Rugi & Pengingat WA",
      desc: "Rekap kas per shift anti selisih, laporan laba rugi otomatis, promo voucher, referral, dan pengingat masa aktif via WhatsApp.",
    },
  ];

  const waGeneralUrl = buildWhatsAppUrl(
    settings.whatsapp_number || "081299998888",
    `Halo ${settings.name}, saya ingin bertanya tentang pendaftaran membership gym.`
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
              <p className="text-sm font-bold leading-tight text-white">
                {settings.name}
              </p>
              <p className="text-[11px] text-slate-400">
                Modern Fitness & Gym Management
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#fitur" className="hover:text-white">
              Fitur
            </a>
            <a href="#paket" className="hover:text-white">
              Harga Paket
            </a>
            <a href="#kelas" className="hover:text-white">
              Kelas & Trainer
            </a>
            <a href="#lokasi" className="hover:text-white">
              Lokasi
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
                Masuk Staff <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Sistem Manajemen Gym Terintegrasi · QR Check-in & Portal Member
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Latihan Lebih Konsisten di{" "}
            <span className="text-emerald-400">{settings.name}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            Peralatan lengkap, instruktur bersertifikat, presensi instan lewat
            QR Code atau ID Member, serta manajemen membership transparan dalam
            satu platform modern.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#paket"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Lihat Harga Membership
            </a>
            <a
              href={waGeneralUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Daftar via WhatsApp
            </a>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
            >
              Login Owner / Kasir
            </Link>
          </div>
        </div>
      </section>

      {/* Fitur Lengkap */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Semua Fitur Unggulan Kami
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Dirancang untuk kenyamanan member dan akurasi operasional gym
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-emerald-500/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Harga Paket & Subscription */}
      <section
        id="paket"
        className="border-y border-slate-800 bg-slate-900/50 px-4 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Paket & Harga Membership
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Pilih paket harian atau langganan bulanan sesuai target latihan
              Anda
            </p>
          </div>

          {promos.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {promos.map((pr) => (
                <div
                  key={pr.id}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-200"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>
                    <strong>{pr.name}</strong>
                    {pr.code ? ` · Kode: ${pr.code}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const isPopular = pkg.duration_days === 90;
              const waPkgUrl = buildWhatsAppUrl(
                settings.whatsapp_number || "081299998888",
                `Halo ${settings.name}, saya tertarik mendaftar paket ${pkg.name} (${formatRupiah(pkg.price)}).`
              );
              return (
                <div
                  key={pkg.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 ${
                    isPopular
                      ? "border-emerald-500 bg-slate-900 shadow-lg shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-900/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                        {pkg.type === "daily"
                          ? "Kunjungan Harian"
                          : `Durasi ${pkg.duration_days} Hari`}
                      </span>
                      {isPopular && (
                        <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-slate-950">
                          Terpopuler
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-white">
                      {pkg.name}
                    </h3>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-400">
                      {formatRupiah(pkg.price)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {pkg.registration_fee > 0
                        ? `+ Biaya pendaftaran awal ${formatRupiah(pkg.registration_fee)}`
                        : "Bebas biaya pendaftaran"}
                    </p>
                    <p className="mt-4 text-sm text-slate-300">
                      {pkg.description}
                    </p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Akses penuh seluruh peralatan gym
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        QR Code & ID Presensi pribadi
                      </li>
                      {pkg.type === "membership" && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Portal Member & fitur cuti (Freeze)
                        </li>
                      )}
                    </ul>
                  </div>

                  <a
                    href={waPkgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-bold transition ${
                      isPopular
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    Pilih Paket Ini
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kelas & Personal Trainer */}
      <section id="kelas" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Personal Trainer Bersertifikat
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Latihan terarah sesuai target bulking, fat loss, atau kebugaran
            </p>
            <div className="mt-6 space-y-3">
              {trainers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">
                      {t.specialty || "General Fitness"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Tersedia
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Jadwal Kelas Terdekat
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Ikuti kelas grup bersama instruktur berpengalaman
            </p>
            <div className="mt-6 space-y-3">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">{c.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateId(c.class_date)} · {c.start_time}–
                        {c.end_time} · {c.trainer_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-300">
                    {c.booked_count}/{c.max_capacity} slot
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lokasi & Footer */}
      <footer
        id="lokasi"
        className="border-t border-slate-800 bg-slate-900/70 px-4 py-12"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <MapPin className="h-4 w-4 text-emerald-400" />
              {settings.name}
            </div>
            <p className="mt-1 text-sm text-slate-400">{settings.address}</p>
            <p className="mt-1 text-xs text-slate-500">
              Buka Setiap Hari · 06:00 – 22:00 WIB · WA:{" "}
              {settings.whatsapp_number}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Portal Staff (Owner / Kasir)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
