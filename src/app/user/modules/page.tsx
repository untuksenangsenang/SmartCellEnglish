'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Calendar, ArrowRight, Loader2, Inbox, Search, X, Sparkles } from 'lucide-react'

interface ModuleType {
  id: string
  title: string
  created_at: string
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 130, damping: 16 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

// Pasangan warna gradient tiap card berputar
const CARD_THEMES = [
  { dot: 'bg-emerald-400', ring: 'ring-emerald-100', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'from-emerald-400 to-teal-400' },
  { dot: 'bg-violet-400',  ring: 'ring-violet-100',  badge: 'bg-violet-50 text-violet-700 border-violet-200',   bar: 'from-violet-400 to-indigo-400' },
  { dot: 'bg-amber-400',   ring: 'ring-amber-100',   badge: 'bg-amber-50 text-amber-700 border-amber-200',      bar: 'from-amber-400 to-orange-400' },
  { dot: 'bg-sky-400',     ring: 'ring-sky-100',     badge: 'bg-sky-50 text-sky-700 border-sky-200',            bar: 'from-sky-400 to-blue-400' },
  { dot: 'bg-rose-400',    ring: 'ring-rose-100',    badge: 'bg-rose-50 text-rose-700 border-rose-200',         bar: 'from-rose-400 to-pink-400' },
]

export default function ModulesListPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [modules, setModules]     = useState<ModuleType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) setModules(data)
      setIsLoading(false)
    }
    fetchModules()
  }, [supabase])

  const filtered = modules.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 selection:bg-emerald-500 selection:text-white">

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 bg-teal-100/40 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-5 md:px-8 pt-6 pb-8 space-y-5">

          {/* Back */}
          <button
            onClick={() => router.push('/user')}
            className="group inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </button>

          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Microlearning
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Modul Pembelajaran
              </h1>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                Pilih modul untuk mulai mendalami materi bahasa Inggris dan kerjakan kuis interaktif.
              </p>
            </div>

            {/* Count badge */}
            {!isLoading && modules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200"
              >
                <span className="text-2xl font-black leading-none">{modules.length}</span>
                <span className="text-[10px] font-semibold opacity-80 mt-0.5">Modul</span>
              </motion.div>
            )}
          </div>

          {/* Search */}
          {!isLoading && modules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative w-full sm:w-80"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari modul..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder-slate-400 transition-all"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 pb-24">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Memuat modul...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && modules.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Belum ada modul</h4>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Modul bimbingan sedang disiapkan oleh Admin.
              </p>
            </div>
          </motion.div>
        )}

        {/* No results */}
        {!isLoading && modules.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-3 text-center"
          >
            <Search className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              Tidak ada hasil untuk <span className="font-semibold text-slate-700">&ldquo;{search}&rdquo;</span>
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
            >
              Reset pencarian
            </button>
          </motion.div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((mod, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length]
                const num   = String(idx + 1).padStart(2, '0')
                return (
                  <motion.div
                    key={mod.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-slate-200/60 hover:border-slate-300 transition-all duration-250"
                  >
                    {/* Top gradient bar */}
                    <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />

                    <div className="p-6 flex flex-col flex-1">

                      {/* Header row */}
                      <div className="flex items-start justify-between mb-4 gap-2">
                        {/* Module number with ring */}
                        <div className={`w-9 h-9 rounded-xl ring-4 ${theme.ring} flex items-center justify-center shrink-0`}>
                          <div className={`w-3 h-3 rounded-full ${theme.dot}`} />
                        </div>

                        {/* Badge */}
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                          #{num}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-slate-700 transition-colors flex-1">
                        {mod.title}
                      </h3>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(mod.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => router.push(`/user/modules/${mod.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:border-slate-900 hover:text-white text-slate-700 text-sm font-semibold transition-all duration-200 group/btn"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Mulai Belajar
                        <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}