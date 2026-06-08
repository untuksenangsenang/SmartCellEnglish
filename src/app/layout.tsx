import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // 1. Import Navbar global
import Footer from "@/components/Footer"; // 2. Import Footer global

const geistSans = Geist({
  variable: "--font-semibold-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 3. Perbarui Metadata Aplikasi agar sesuai dengan judul PKM-PM
export const metadata: Metadata = {
  title: "Smart Cell English — LPKA Kelas II Yogyakarta",
  description: "Platform Microlearning Bahasa Inggris interaktif untuk anak binaan LPKA Kelas II Yogyakarta oleh Tim PKM-PM Universitas Ahmad Dahlan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // 4. Ubah bahasa utama ke Indonesia (id)
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        
        {/* Navbar akan selalu muncul di bagian paling atas semua halaman */}
        <Navbar />
        
        {/* Konten halaman (children) akan mengisi sisa ruang kosong secara dinamis */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        
        {/* Footer akan selalu berada di bagian paling bawah halaman (Sticky Footer) */}
        <Footer />
        
      </body>
    </html>
  );
}