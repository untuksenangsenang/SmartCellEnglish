"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogIn, LogOut, User, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listener untuk event instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA diinstal");
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleLogout = async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        alert("Anda sedang offline. Pastikan koneksi internet aktif untuk keluar.");
        return; // Jangan lanjutkan logout jika offline
      }

      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Kesalahan saat logout:", error);
      alert("Gagal melakukan logout akibat gangguan jaringan.");
    }
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md h-16 border-b border-slate-200/60 sticky top-0 z-50 shadow-xs px-4 md:px-8 flex items-center justify-between">
      
      {/* Identitas Logo & Brand */}
      <Link href="/" className="flex items-center gap-2 md:gap-3 group">
        <div className="relative w-8 h-8 md:w-9 md:h-9 transition-transform group-hover:scale-105">
          <Image
            src="/logo.png" 
            alt="Smart Cell English Logo"
            fill
            sizes="(max-width: 768px) 32px, 36px"
            className="object-contain"
            priority
          />
        </div>
        <span className="font-extrabold text-sm md:text-lg text-blue-700 tracking-wide uppercase md:normal-case">
          Smart Cell English
        </span>
      </Link>

      {/* Tombol Aksi Dinamis Tergantung Status Login */}
      {!loading && (
        user ? (
          <div className="flex items-center gap-3 md:gap-4">
            {/* Indikator Email Pengguna (Hanya tampil di desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-blue-50 px-3 py-1.5 rounded-full">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[140px] truncate">{user.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-bold text-red-600 transition-all shrink-0 cursor-pointer border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
            
            {/* Tombol Install Aplikasi PWA */}
            {isInstallable && (
              <button
                onClick={handleInstallApp}
                className="hidden md:flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk
          </Link>
        )
      )}

    </nav>
  );
}