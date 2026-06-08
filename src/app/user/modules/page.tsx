'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, Variants } from 'framer-motion'
import { ArrowLeft, BookOpen, Calendar, ArrowRight, Loader2, Inbox } from 'lucide-react'

interface ModuleType {
  id: string
  title: string
  created_at: string
}

export default function ModulesListPage() {
  const router = useRouter()
  const supabase = createClient()
  const [modules, setModules] = useState<ModuleType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setModules(data)
      }
      setIsLoading(false)
    }

    fetchModules()
  }, [supabase])

  // Konfigurasi animasi stagger untuk list kartu materi
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  // Berhasil diperbaiki: tipe data dikunci dengan : Variants untuk menghindari error TS2322
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 100 
      } 
    }
  }

  return (
    // Background murni putih (bg-white)
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        
        {/* Tombol Kembali ke Dashboard */}
        <div>
          <button 
            onClick={() => router.push('/user')}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Dashboard
          </button>
        </div>

        {/* Header Konten */}
        <div className="space-y-1.5 border-b border-slate-100 pb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-emerald-600 shrink-0" />
            Modul Pembelajaran Mandiri
          </h2>
          <p className="text-base text-slate-500 font-medium max-w-2xl leading-relaxed">
            Pilih salah satu modul di bawah ini untuk mulai mendalami materi bahasa Inggris harian dan menguji kesiapan belajarmu melalui kuis interaktif.
          </p>
        </div>

        {/* Kondisi Status Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500 tracking-wide">
              Sedang memuat daftar modul materi...
            </p>
          </div>
        ) : modules.length === 0 ? (
          /* Kondisi Data Modul Kosong */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Belum Ada Materi</h4>
              <p className="text-sm text-slate-500 max-w-xs mt-1">
                Modul bimbingan mandiri belum diterbitkan atau sedang disiapkan oleh tim Admin.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Daftar Grid Modul */
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {modules.map((mod) => (
              <motion.div 
                key={mod.id} 
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight leading-snug group-hover:text-emerald-600 transition-colors">
                    {mod.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Rilis: {new Date(mod.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => router.push(`/user/modules/${mod.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-4 font-bold text-sm text-white shadow-md shadow-emerald-600/10 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
                  >
                    Mulai Belajar & Kuis
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}