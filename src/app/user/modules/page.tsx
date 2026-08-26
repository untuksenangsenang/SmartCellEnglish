'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Inbox,
  Loader2,
  Search,
  Sparkles,
  X,
  Layers3,
  GraduationCap,
} from 'lucide-react'

interface ModuleType {
  id: string
  title: string
  created_at: string
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 16,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.18,
    },
  },
}

const CARD_THEMES = [
  {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    glow: 'group-hover:shadow-emerald-200/60',
  },
  {
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    soft: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-100',
    glow: 'group-hover:shadow-violet-200/60',
  },
  {
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
    glow: 'group-hover:shadow-amber-200/60',
  },
  {
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-100',
    glow: 'group-hover:shadow-sky-200/60',
  },
  {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    soft: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-100',
    glow: 'group-hover:shadow-rose-200/60',
  },
]

export default function ModulesListPage() {
  const router = useRouter()
  const [modules, setModules] = useState<ModuleType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true

    const fetchModules = async () => {
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from('modules')
          .select('id, title, created_at')
          .order('created_at', {
            ascending: false,
          })

        if (error) {
          console.error('fetchModules error:', error)
          return
        }

        if (mounted) {
          setModules((data || []) as ModuleType[])
        }
      } catch (error) {
        console.error('fetchModules error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchModules()

    return () => {
      mounted = false
    }
  }, [supabase])

  const filteredModules = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return modules
    }

    return modules.filter((module) =>
      module.title.toLowerCase().includes(keyword)
    )
  }, [modules, search])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const handleOpenModule = (id: string) => {
    router.push(`/user/modules/${id}`)
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-800">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute bottom-[-160px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-5 sm:px-6 md:px-8 md:pb-14 md:pt-7">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            type="button"
            onClick={() => router.push('/user')}
            className="group mb-10 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Dashboard
          </motion.button>

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            {/* Hero text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Learning Center
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                Modul
                <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  {' '}
                  Pembelajaran
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Jelajahi berbagai modul pembelajaran yang telah disiapkan
                untuk membantu Anda memahami materi dengan lebih terstruktur
                dan interaktif.
              </p>

              {/* Mini stats */}
              {!isLoading && (
                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md">
                    <Layers3 className="h-4 w-4 text-emerald-300" />
                    <span className="text-xs font-semibold text-slate-300">
                      {modules.length} Modul tersedia
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md">
                    <GraduationCap className="h-4 w-4 text-cyan-300" />
                    <span className="text-xs font-semibold text-slate-300">
                      Belajar sesuai kecepatan Anda
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Big count */}
            {!isLoading && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  rotate: -4,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 14,
                  delay: 0.15,
                }}
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/20 blur-2xl" />

                  <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur-xl">
                    <span className="text-5xl font-black tracking-tight">
                      {modules.length}
                    </span>

                    <span className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      Modul
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Search */}
          {!isLoading && modules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-8"
            >
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari modul pembelajaran..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.08] py-3.5 pl-11 pr-11 text-sm font-medium text-white outline-none backdrop-blur-xl transition-all placeholder:text-slate-500 focus:border-emerald-400/50 focus:bg-white/[0.12] focus:ring-4 focus:ring-emerald-500/10"
                />

                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{
                        opacity: 0,
                        scale: 0.7,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.7,
                      }}
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================
          CONTENT
      ========================================================== */}
      <main className="mx-auto max-w-6xl px-5 py-8 pb-24 sm:px-6 md:px-8 md:py-10">
        {/* Section heading */}
        {!isLoading && modules.length > 0 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-6 flex items-end justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  Koleksi Modul
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Mulai perjalanan belajar
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">
                {search
                  ? `${filteredModules.length} modul ditemukan`
                  : `${modules.length} modul siap dipelajari`}
              </p>
            </div>

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 sm:inline-flex"
              >
                Reset
              </button>
            )}
          </motion.div>
        )}

        {/* =======================================================
            LOADING
        ======================================================== */}
        {isLoading && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12"
          >
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-200/50" />

                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
              </div>

              <h3 className="mt-5 text-sm font-black text-slate-800">
                Menyiapkan modul
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Mohon tunggu sebentar...
              </p>
            </div>
          </motion.div>
        )}

        {/* =======================================================
            EMPTY
        ======================================================== */}
        {!isLoading && modules.length === 0 && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-24"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl" />

            <div className="relative mx-auto flex max-w-sm flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 ring-8 ring-slate-50">
                <Inbox className="h-8 w-8 text-slate-400" />
              </div>

              <h3 className="mt-6 text-lg font-black text-slate-800">
                Belum ada modul
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Modul pembelajaran belum tersedia. Silakan kembali lagi nanti
                setelah materi ditambahkan.
              </p>
            </div>
          </motion.div>
        )}

        {/* =======================================================
            NO SEARCH RESULT
        ======================================================== */}
        {!isLoading &&
          modules.length > 0 &&
          filteredModules.length === 0 && (
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center sm:py-20"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Search className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-5 text-sm font-black text-slate-700">
                Modul tidak ditemukan
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-slate-400">
                Tidak ada modul yang cocok dengan pencarian{' '}
                <span className="font-bold text-slate-600">
                  &ldquo;{search}&rdquo;
                </span>
                .
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
              >
                Tampilkan Semua Modul
              </button>
            </motion.div>
          )}

        {/* =======================================================
            MODULE GRID
        ======================================================== */}
        {!isLoading && filteredModules.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredModules.map((module, index) => {
                const theme =
                  CARD_THEMES[index % CARD_THEMES.length]

                const moduleNumber = String(index + 1).padStart(2, '0')

                return (
                  <motion.article
                    key={module.id}
                    variants={itemVariants}
                    layout
                    whileHover={{
                      y: -6,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    }}
                    className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 ${theme.glow} hover:shadow-2xl`}
                  >
                    {/* Gradient top */}
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`}
                    />

                    {/* Glow */}
                    <div
                      className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${theme.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10`}
                    />

                    <div className="relative flex h-full flex-col p-5 sm:p-6">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg`}
                        >
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <span
                          className={`rounded-xl border ${theme.border} ${theme.soft} px-2.5 py-1.5 text-[10px] font-black tracking-widest ${theme.text}`}
                        >
                          MODUL {moduleNumber}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-6 flex-1">
                        <h3 className="line-clamp-3 text-lg font-black leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-slate-700">
                          {module.title}
                        </h3>

                        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>

                          <span>
                            Ditambahkan {formatDate(module.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => handleOpenModule(module.id)}
                        className={`group/cta mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3.5 text-left text-white shadow-sm transition-all duration-300 hover:bg-gradient-to-r ${theme.gradient} hover:shadow-lg`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                            <BookOpen className="h-3.5 w-3.5" />
                          </span>

                          <span className="text-xs font-black">
                            Mulai Belajar
                          </span>
                        </span>

                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 transition-transform duration-300 group-hover/cta:translate-x-1">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}