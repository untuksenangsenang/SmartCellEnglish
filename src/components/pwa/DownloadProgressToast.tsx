"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, DownloadCloud } from "lucide-react";

export interface DownloadProgressToastProps {
  isOpen: boolean;
  moduleTitle: string;
  progress: number; // 0 to 100
  statusText: string;
  isCompleted: boolean;
  onClose: () => void;
}

export default function DownloadProgressToast({
  isOpen,
  moduleTitle,
  progress,
  statusText,
  isCompleted,
  onClose,
}: DownloadProgressToastProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} // Spring-like ease
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 overflow-hidden"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-2xl p-4 sm:p-5 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 pr-6">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors duration-500 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <DownloadCloud className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1" title={moduleTitle}>
                    {moduleTitle}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {isCompleted ? "Penyimpanan selesai" : "Menyimpan materi..."}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Area */}
            {!isCompleted ? (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 line-clamp-1 pr-2">{statusText}</span>
                  <span className="text-blue-600 tabular-nums">{Math.round(progress)}%</span>
                </div>
                
                {/* Progress Bar Track */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  {/* Animated Fill */}
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center"
              >
                Materi siap diakses secara offline!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
