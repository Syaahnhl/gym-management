import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymMate — Platform Manajemen Gym Modern",
  description:
    "Platform SaaS manajemen gym untuk owner dan kasir: member, presensi QR & ID, POS produk, shift kasir, freeze, PT, kelas, dan laporan laba rugi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
