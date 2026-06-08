"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Ambil data sesi user saat komponen pertama kali dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // 2. Pasang listener untuk mendeteksi perubahan status login/logout secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
        <span className="font-extrabold text-sm md:text-lg text-emerald-600 tracking-wide uppercase md:normal-case">
          Smart Cell English
        </span>
      </Link>

      {/* Tombol Aksi Dinamis Tergantung Status Login */}
      {!loading && (
        user ? (
          <div className="flex items-center gap-3 md:gap-4">
            {/* Indikator Email Pengguna (Hanya tampil di desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[140px] truncate">{user.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-bold text-red-600 transition-all shrink-0 cursor-pointer border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk
          </Link>
        )
      )}

    </nav>
  );
}