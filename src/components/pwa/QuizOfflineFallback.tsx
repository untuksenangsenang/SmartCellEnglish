"use client";

import { WifiOff, RefreshCcw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export interface QuizOfflineFallbackProps {
  children: React.ReactNode;
}

export default function QuizOfflineFallback({ children }: QuizOfflineFallbackProps) {
  const isOnline = useNetworkStatus();

  // Jika online, tampilkan konten kuis secara normal
  if (isOnline) {
    return <>{children}</>;
  }

  // Jika offline, tampilkan Fallback State
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
        <WifiOff className="w-8 h-8 text-slate-400" />
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-3">
        Koneksi Terputus
      </h2>
      
      <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Kuis dan latihan soal memerlukan koneksi internet untuk mencatat dan menyinkronkan nilai Anda secara real-time ke sistem. 
        Silakan hubungkan kembali perangkat Anda ke internet.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <RefreshCcw className="w-4 h-4" />
        Muat Ulang Halaman
      </button>
    </div>
  );
}
