"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Dumbbell,
  Menu,
  QrCode,
  Scale,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";

const SUB_FEATURES = [
  {
    icon: QrCode,
    title: "Presensi Scan QR & ID",
    desc: "Scan QR member < 5 detik lewat kamera atau scanner USB tanpa catat buku manual.",
    href: "#cara-kerja",
  },
  {
    icon: Scale,
    title: "Input BB & Pantau BMI",
    desc: "Catat berat badan saat check-in, hitung BMI otomatis & pantau progres member.",
    href: "#solusi",
  },
  {
    icon: ShoppingCart,
    title: "Kasir POS & Shift Kasir",
    desc: "Jual produk, minuman, suplemen & tutup shift kasir anti-selisih.",
    href: "#solusi",
  },
  {
    icon: TrendingUp,
    title: "Panel Owner & Laba Rugi",
    desc: "Pantau omzet, pengeluaran, dan edit harga paket/produk dari satu panel.",
    href: "#solusi",
  },
  {
    icon: UserCheck,
    title: "Portal Member Digital",
    desc: "Member punya kartu QR sendiri, cek masa aktif, dan pantau grafik BMI.",
    href: "#solusi",
  },
];

interface LandingNavbarProps {
  subtitle?: string;
  loginHref?: string;
  loginLabel?: string;
  onGoLogin?: () => void;
  onGoPortal?: () => void;
  navLinks?: Array<{ href: string; label: string }>;
}

export function LandingNavbar({
  subtitle = "Sistem Manajemen Gym Modern",
  loginHref = "/login",
  loginLabel = "Masuk Dashboard",
  onGoLogin,
  onGoPortal,
  navLinks = [
    { href: "#masalah", label: "Masalah" },
    { href: "#solusi", label: "Solusi" },
    { href: "#cara-kerja", label: "Alur QR" },
    { href: "#harga-sistem", label: "Paket Sistem" },
  ],
}: LandingNavbarProps) {
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base sm:text-lg text-slate-900 block leading-none">
              GymMate
            </span>
            {subtitle && (
              <span className="text-[10px] text-slate-500 truncate hidden sm:block">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Nav with Sub-Fitur Dropdown */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <div
            className="relative"
            onMouseEnter={() => setDesktopDropdownOpen(true)}
            onMouseLeave={() => setDesktopDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDesktopDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1 py-2 text-slate-800 hover:text-blue-600 transition-colors"
            >
              <span>Sub Fitur</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  desktopDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {desktopDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-[420px] z-50">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl space-y-1">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Penjelasan Sub-Fitur GymMate
                  </p>
                  {SUB_FEATURES.map((sf) => {
                    const Icon = sf.icon;
                    return (
                      <a
                        key={sf.title}
                        href={sf.href}
                        onClick={() => setDesktopDropdownOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {sf.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {sf.desc}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {navLinks.map((lnk) => (
            <a
              key={lnk.href}
              href={lnk.href}
              className="hover:text-blue-600 transition-colors"
            >
              {lnk.label}
            </a>
          ))}
        </nav>

        {/* Actions + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {onGoPortal && (
            <button
              type="button"
              onClick={onGoPortal}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              Portal Member
            </button>
          )}
          {onGoLogin ? (
            <button
              type="button"
              onClick={onGoLogin}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
            >
              {loginLabel}
            </button>
          ) : (
            <Link
              href={loginHref}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
            >
              {loginLabel}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Buka Menu Sub Fitur"
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 max-h-[82vh] overflow-y-auto shadow-lg">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 space-y-2">
            <button
              type="button"
              onClick={() => setMobileSubOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-blue-700"
            >
              <span>Penjelasan Sub-Fitur GymMate</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileSubOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileSubOpen && (
              <div className="space-y-2 pt-1">
                {SUB_FEATURES.map((sf) => {
                  const Icon = sf.icon;
                  return (
                    <a
                      key={sf.title}
                      href={sf.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-100"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">
                          {sf.title}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {sf.desc}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((lnk) => (
              <a
                key={lnk.href}
                href={lnk.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 text-center"
              >
                {lnk.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {onGoPortal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoPortal();
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
              >
                Buka Portal Member (QR & BMI)
              </button>
            )}
            {onGoLogin ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoLogin();
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                {loginLabel}
              </button>
            ) : (
              <Link
                href={loginHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold text-center"
              >
                {loginLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
