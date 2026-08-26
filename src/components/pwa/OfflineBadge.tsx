"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Download, Loader2 } from "lucide-react";

export type OfflineStatus = "available" | "downloading" | "not-downloaded";

export interface OfflineBadgeProps {
  status: OfflineStatus;
  onDownloadClick?: () => void;
  className?: string;
}

export default function OfflineBadge({
  status,
  onDownloadClick,
  className = "",
}: OfflineBadgeProps) {
  // State 1: Available Offline
  if (status === "available") {
    return (
      <div
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 backdrop-blur-sm cursor-default transition-all hover:bg-emerald-100/80 ${className}`}
        title="Tersedia offline"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-[10px] font-semibold text-emerald-700 tracking-wide uppercase">
          Tersimpan
        </span>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
          Materi tersedia offline
          {/* Arrow */}
          <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
        </div>
      </div>
    );
  }

  // State 2: Downloading
  if (status === "downloading") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 backdrop-blur-sm ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span className="text-[10px] font-semibold text-blue-700 tracking-wide uppercase">
          Mengunduh
        </span>
      </div>
    );
  }

  // State 3: Not Downloaded (Ghost Button)
  return (
    <button
      onClick={onDownloadClick}
      className={`group relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all text-slate-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
      aria-label="Simpan untuk Offline"
    >
      <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
        Simpan ke perangkat
        <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
      </div>
    </button>
  );
}
