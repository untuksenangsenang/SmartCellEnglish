"use client";

import { useEffect, useState } from "react";

// Tipe untuk event beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Registrasi Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("Service Worker registration successful with scope: ", registration.scope);
          },
          function (err) {
            console.log("Service Worker registration failed: ", err);
          }
        );
      });
    }

    // 2. Mendengarkan event instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      // Mencegah mini-infobar Chrome muncul di mobile
      e.preventDefault();
      // Simpan event untuk bisa dipanggil nanti oleh tombol custom kita
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 3. Deteksi Status Online / Offline
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cek status saat pertama kali render
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Tampilkan prompt bawaan browser
    deferredPrompt.prompt();

    // Tunggu respon pengguna
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the A2HS prompt");
    } else {
      console.log("User dismissed the A2HS prompt");
    }

    // Kosongkan deferredPrompt agar tidak muncul lagi kecuali di-refresh/dapat event lagi
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <>
      {/* Toast Offline */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
        </div>
      )}

      {/* Banner Install PWA */}
      {isInstallable && !isOffline && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-4 w-80 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Install Smart Cell</h3>
                <p className="text-xs text-slate-500 mt-0.5">Akses lebih cepat & mendukung mode offline.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsInstallable(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <button
            onClick={handleInstallClick}
            className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Install App Sekarang
          </button>
        </div>
      )}
    </>
  );
}
