"use client";

import { useState } from "react";
import OfflineBadge, { OfflineStatus } from "./OfflineBadge";
import DownloadProgressToast from "./DownloadProgressToast";
import { BookOpen, Clock, PlayCircle } from "lucide-react";

interface ModuleData {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: "video" | "reading";
}

export default function ModuleCardExample() {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("not-downloaded");
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Data dummy untuk contoh modul
  const moduleData: ModuleData = {
    id: "mod-1",
    title: "Unit 1: Greetings & Introductions",
    description: "Pelajari cara menyapa dan memperkenalkan diri dalam bahasa Inggris untuk percakapan sehari-hari.",
    duration: "15 Menit",
    type: "video",
  };

  const handleDownloadClick = () => {
    // 1. Set state mulai mengunduh
    setOfflineStatus("downloading");
    setIsToastOpen(true);
    setProgress(0);
    setIsCompleted(false);
    setStatusText("Menginisialisasi unduhan...");

    // 2. Simulasi proses download
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5; // Naik random 5-20%
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);

      // Ubah teks status berdasarkan progress
      if (currentProgress < 30) {
        setStatusText("Menyimpan aset video (1/3)...");
      } else if (currentProgress < 70) {
        setStatusText("Mengunduh modul teks (2/3)...");
      } else if (currentProgress < 100) {
        setStatusText("Menyimpan kuis ke lokal (3/3)...");
      } else {
        // Selesai
        clearInterval(interval);
        setStatusText("Selesai");
        setIsCompleted(true);
        setOfflineStatus("available");
        
        // Auto close setelah 3 detik
        setTimeout(() => {
          setIsToastOpen(false);
        }, 3000);
      }
    }, 600); // Update tiap 600ms
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 relative">
      {/* 
        KARTU MODUL
        Contoh implementasi OfflineBadge di pojok kanan atas kartu.
      */}
      <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
        
        {/* Header / Thumbnail Area */}
        <div className="h-32 bg-slate-100 relative p-4 flex flex-col justify-between overflow-hidden">
          {/* Aksen Background (Opsional) */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/80 backdrop-blur text-blue-700 p-2 rounded-xl shadow-sm">
              {moduleData.type === 'video' ? <PlayCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            
            {/* INDIKATOR OFFLINE */}
            <OfflineBadge 
              status={offlineStatus} 
              onDownloadClick={handleDownloadClick} 
            />
          </div>
        </div>

        {/* Konten Kartu */}
        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-blue-700 transition-colors">
            {moduleData.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4">
            {moduleData.description}
          </p>
          
          <div className="flex items-center text-xs font-semibold text-slate-400 gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {moduleData.duration}
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              1 Materi
            </div>
          </div>
        </div>
      </div>

      {/* 
        TOAST PROGRESS DOWNLOAD
        Letakkan ini di root level (layout) jika Anda ingin menggunakannya
        sebagai global state, atau di dalam halaman yang memerlukannya.
      */}
      <DownloadProgressToast
        isOpen={isToastOpen}
        moduleTitle={moduleData.title}
        progress={progress}
        statusText={statusText}
        isCompleted={isCompleted}
        onClose={() => setIsToastOpen(false)}
      />
    </div>
  );
}
