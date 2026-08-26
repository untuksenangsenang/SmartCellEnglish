'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/utils/supabase/client'

import { motion, AnimatePresence } from 'framer-motion'

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ListFilter,
  Loader2,
  Search,
  X,
  AlertCircle,
} from 'lucide-react'

// ============================================================
// SUPABASE
// ============================================================

const supabase = createClient()

// ============================================================
// TYPES
// ============================================================

interface SubjectData {
  id: string
  name: string
}

interface HomeworkData {
  id: string
  created_at: string
  title: string
  description: string | null
  mapel: string | null
  subject_id: string | null
  due_date: string | null
  created_by?: string | null
}

type StatusState = {
  success?: boolean
  msg?: string
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateString: string | null) {
  if (!dateString) return '-'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '-'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isPastDue(dateString: string | null) {
  if (!dateString) return false

  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const due = new Date(`${dateString}T00:00:00`)

  due.setHours(0, 0, 0, 0)

  return due < today
}

function isDueToday(dateString: string | null) {
  if (!dateString) return false

  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const due = new Date(`${dateString}T00:00:00`)

  due.setHours(0, 0, 0, 0)

  return due.getTime() === today.getTime()
}

// ============================================================
// COMPONENT
// ============================================================

export default function UserHomeworkPage() {
  // ==========================================================
  // DATA
  // ==========================================================

  const [homeworkList, setHomeworkList] = useState<HomeworkData[]>([])

  const [subjectsList, setSubjectsList] = useState<SubjectData[]>([])

  // ==========================================================
  // UI
  // ==========================================================

  const [isLoading, setIsLoading] = useState(true)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [status, setStatus] = useState<StatusState>({})

  // ==========================================================
  // FILTER
  // ==========================================================

  const [filterSubjectId, setFilterSubjectId] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  // ==========================================================
  // DETAIL
  // ==========================================================

  const [selectedHomework, setSelectedHomework] =
    useState<HomeworkData | null>(null)

  // ==========================================================
  // FETCH SUBJECTS
  // ==========================================================

  const fetchSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name', {
        ascending: true,
      })

    if (error) {
      throw error
    }

    setSubjectsList((data || []) as SubjectData[])
  }, [])

  // ==========================================================
  // FETCH HOMEWORK
  // ==========================================================

  const fetchHomeworks = useCallback(async () => {
    const { data, error } = await supabase
      .from('homework')
      .select(
        'id, created_at, title, description, mapel, subject_id, due_date, created_by'
      )
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      throw error
    }

    setHomeworkList((data || []) as HomeworkData[])
  }, [])

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setIsLoading(true)
      setStatus({})

      try {
        const [subjectsResult, homeworkResult] =
          await Promise.allSettled([
            fetchSubjects(),
            fetchHomeworks(),
          ])

        if (!mounted) return

        const subjectError =
          subjectsResult.status === 'rejected'
            ? subjectsResult.reason
            : null

        const homeworkError =
          homeworkResult.status === 'rejected'
            ? homeworkResult.reason
            : null

        if (subjectError || homeworkError) {
          const error =
            subjectError || homeworkError

          const message =
            error instanceof Error
              ? error.message
              : 'Gagal mengambil data PR.'

          setStatus({
            success: false,
            msg: message,
          })
        }
      } catch (error) {
        if (!mounted) return

        const message =
          error instanceof Error
            ? error.message
            : 'Gagal mengambil data.'

        setStatus({
          success: false,
          msg: message,
        })
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [fetchSubjects, fetchHomeworks])

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setStatus({})

    try {
      await Promise.all([
        fetchSubjects(),
        fetchHomeworks(),
      ])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui data PR.'

      setStatus({
        success: false,
        msg: message,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // ==========================================================
  // SUBJECT NAME
  // ==========================================================

  const getSubjectName = useCallback(
    (homework: HomeworkData) => {
      // Prioritas utama:
      // subject_id -> subjects.name

      if (homework.subject_id) {
        const subject = subjectsList.find(
          (item) => item.id === homework.subject_id
        )

        if (subject) {
          return subject.name
        }
      }

      // Fallback untuk data lama

      if (homework.mapel?.trim()) {
        return homework.mapel.trim()
      }

      return 'Tanpa Mata Pelajaran'
    },
    [subjectsList]
  )

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredHomeworkList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return homeworkList.filter((homework) => {
      // Filter subject

      if (
        filterSubjectId &&
        homework.subject_id !== filterSubjectId
      ) {
        return false
      }

      // Search

      if (query) {
        const subjectName =
          getSubjectName(homework).toLowerCase()

        const title =
          homework.title?.toLowerCase() || ''

        const description =
          homework.description?.toLowerCase() || ''

        const oldMapel =
          homework.mapel?.toLowerCase() || ''

        const matches =
          title.includes(query) ||
          description.includes(query) ||
          subjectName.includes(query) ||
          oldMapel.includes(query)

        if (!matches) {
          return false
        }
      }

      return true
    })
  }, [
    homeworkList,
    filterSubjectId,
    searchQuery,
    getSubjectName,
  ])

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalHomework = homeworkList.length

  const expiredHomework = homeworkList.filter((item) =>
    isPastDue(item.due_date)
  ).length

  const activeHomework =
    totalHomework - expiredHomework

  // ==========================================================
  // CLEAR FILTER
  // ==========================================================

  const clearFilters = () => {
    setFilterSubjectId('')
    setSearchQuery('')
  }

  const hasFilter =
    Boolean(filterSubjectId) ||
    Boolean(searchQuery.trim())

  // ==========================================================
  // OPEN DETAIL
  // ==========================================================

  const handleOpenDetail = (
    homework: HomeworkData
  ) => {
    setSelectedHomework(homework)
  }

  // ==========================================================
  // CLOSE DETAIL
  // ==========================================================

  const handleCloseDetail = () => {
    setSelectedHomework(null)
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <GraduationCap className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/20 text-purple-300 text-[11px] font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              RUANG TUGAS SISWA
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pekerjaan Rumah
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Lihat daftar Pekerjaan Rumah yang
              diberikan oleh pengajar. Pilih tugas
              untuk melihat detail instruksi dan
              tenggat pengerjaannya.
            </p>
          </div>
        </motion.div>

        {/* ================================================== */}
        {/* STATUS */}
        {/* ================================================== */}

        <AnimatePresence>
          {status.msg && (
            <motion.div
              initial={{
                opacity: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -5,
              }}
              className={`rounded-xl border p-4 flex items-start gap-2.5 text-sm ${
                status.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              )}

              <div className="flex-1 font-medium">
                {status.msg}
              </div>

              <button
                type="button"
                onClick={() => setStatus({})}
                className="opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================== */}
        {/* STATISTICS */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Total PR
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  {totalHomework}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ListFilter className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Masih Aktif
                </p>

                <p className="mt-1 text-2xl font-black text-emerald-600">
                  {activeHomework}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Lewat Tenggat
                </p>

                <p className="mt-1 text-2xl font-black text-red-600">
                  {expiredHomework}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Clock3 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* FILTER */}
        {/* ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Cari judul atau isi PR..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>

            {/* SUBJECT */}

            <div className="flex-1 md:max-w-xs">
              <select
                value={filterSubjectId}
                onChange={(e) =>
                  setFilterSubjectId(e.target.value)
                }
                disabled={
                  isLoading ||
                  subjectsList.length === 0
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all disabled:opacity-50"
              >
                <option value="">
                  Semua Mata Pelajaran
                </option>

                {subjectsList.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* RESET */}

            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs font-bold text-slate-500 hover:text-red-600 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Refresh'
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">
              Menampilkan{' '}
              <span className="font-black text-slate-600">
                {filteredHomeworkList.length}
              </span>{' '}
              dari{' '}
              <span className="font-black text-slate-600">
                {homeworkList.length}
              </span>{' '}
              PR
            </p>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
              <GraduationCap className="w-3.5 h-3.5" />
              Daftar mapel mengikuti Subjects
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* SUBJECT EMPTY */}
        {/* ================================================== */}

        {!isLoading &&
          subjectsList.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-xs font-black">
                  Daftar mata pelajaran belum tersedia.
                </p>

                <p className="mt-1 text-[11px] font-medium">
                  PR tetap dapat ditampilkan berdasarkan
                  data yang tersimpan pada kolom mapel.
                </p>
              </div>
            </div>
          )}

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />

            <p className="text-xs font-bold text-slate-400">
              Mengambil daftar PR...
            </p>
          </div>
        ) : filteredHomeworkList.length === 0 ? (
          /* ================================================== */
          /* EMPTY */
          /* ================================================== */

          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-5 h-5 text-slate-300" />
            </div>

            <h3 className="text-sm font-black text-slate-700">
              {hasFilter
                ? 'PR tidak ditemukan'
                : 'Belum ada Pekerjaan Rumah'}
            </h3>

            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {hasFilter
                ? 'Coba ubah kata pencarian atau filter mata pelajaran.'
                : 'Saat pengajar menerbitkan PR baru, tugas tersebut akan muncul di halaman ini.'}
            </p>

            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Hapus Filter
              </button>
            )}
          </div>
        ) : (
          /* ================================================== */
          /* LIST */
          /* ================================================== */

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="grid grid-cols-1 gap-3"
          >
            {filteredHomeworkList.map(
              (homework, index) => {
                const subjectName =
                  getSubjectName(homework)

                const expired =
                  isPastDue(homework.due_date)

                const dueToday =
                  isDueToday(homework.due_date)

                return (
                  <motion.button
                    type="button"
                    key={homework.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.03,
                    }}
                    onClick={() =>
                      handleOpenDetail(homework)
                    }
                    className="w-full text-left rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* ICON */}

                      <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-[10px] font-black uppercase text-purple-700">
                            <GraduationCap className="w-2.5 h-2.5" />
                            {subjectName}
                          </span>

                          {expired ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                              <Clock3 className="w-2.5 h-2.5" />
                              Lewat Tenggat
                            </span>
                          ) : dueToday ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                              <Clock3 className="w-2.5 h-2.5" />
                              Tenggat Hari Ini
                            </span>
                          ) : (
                            homework.due_date && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDate(
                                  homework.due_date
                                )}
                              </span>
                            )
                          )}
                        </div>

                        <h2 className="mt-2 text-base font-black text-slate-900 truncate">
                          {homework.title}
                        </h2>

                        {homework.description && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                            {homework.description}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                          <span>
                            Diterbitkan:{' '}
                            {formatDate(
                              homework.created_at
                            )}
                          </span>

                          {homework.due_date && (
                            <span>
                              Tenggat:{' '}
                              {formatDate(
                                homework.due_date
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ARROW */}

                      <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-purple-50 items-center justify-center shrink-0 transition-all">
                        <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400 group-hover:text-purple-600 transition-all" />
                      </div>
                    </div>
                  </motion.button>
                )
              }
            )}
          </motion.div>
        )}
      </div>

      {/* ==================================================== */}
      {/* DETAIL MODAL */}
      {/* ==================================================== */}

      <AnimatePresence>
        {selectedHomework && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* BACKDROP */}

            <motion.button
              type="button"
              aria-label="Tutup detail"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={handleCloseDetail}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-default"
            />

            {/* MODAL */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >

              {/* MODAL HEADER */}

              <div className="border-b border-slate-100 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-[10px] font-black uppercase text-purple-700">
                        <BookOpen className="w-3 h-3" />
                        {getSubjectName(
                          selectedHomework
                        )}
                      </span>

                      {isPastDue(
                        selectedHomework.due_date
                      ) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                          <Clock3 className="w-3 h-3" />
                          Lewat Tenggat
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-xl font-black text-slate-900 leading-tight">
                      {selectedHomework.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MODAL BODY */}

              <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-170px)] space-y-5">

                {/* INFO */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />

                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Diterbitkan
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-black text-slate-700">
                      {formatDateTime(
                        selectedHomework.created_at
                      )}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      isPastDue(
                        selectedHomework.due_date
                      )
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        isPastDue(
                          selectedHomework.due_date
                        )
                          ? 'text-red-500'
                          : 'text-slate-400'
                      }`}
                    >
                      <Clock3 className="w-4 h-4" />

                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Tenggat
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-xs font-black ${
                        isPastDue(
                          selectedHomework.due_date
                        )
                          ? 'text-red-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {selectedHomework.due_date
                        ? formatDate(
                            selectedHomework.due_date
                          )
                        : 'Tidak ada tenggat'}
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">
                    Detail / Instruksi Tugas
                  </h3>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    {selectedHomework.description ? (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {
                          selectedHomework.description
                        }
                      </p>
                    ) : (
                      <div className="py-5 text-center">
                        <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />

                        <p className="text-xs font-medium text-slate-400">
                          Tidak ada detail instruksi
                          tambahan untuk PR ini.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DEADLINE NOTICE */}

                {selectedHomework.due_date && (
                  <div
                    className={`rounded-xl border p-4 flex items-start gap-3 ${
                      isPastDue(
                        selectedHomework.due_date
                      )
                        ? 'bg-red-50 border-red-200'
                        : isDueToday(
                            selectedHomework.due_date
                          )
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    {isPastDue(
                      selectedHomework.due_date
                    ) ? (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    ) : isDueToday(
                        selectedHomework.due_date
                      ) ? (
                      <Clock3 className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}

                    <div>
                      <p
                        className={`text-xs font-black ${
                          isPastDue(
                            selectedHomework.due_date
                          )
                            ? 'text-red-800'
                            : isDueToday(
                                selectedHomework.due_date
                              )
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {isPastDue(
                          selectedHomework.due_date
                        )
                          ? 'Tugas ini sudah melewati tenggat waktu.'
                          : isDueToday(
                              selectedHomework.due_date
                            )
                          ? 'Tenggat pengumpulan adalah hari ini.'
                          : `Tenggat pengumpulan: ${formatDate(
                              selectedHomework.due_date
                            )}`}
                      </p>

                      {!isPastDue(
                        selectedHomework.due_date
                      ) && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Pastikan tugas dikerjakan dan
                          dikumpulkan sesuai instruksi
                          pengajar.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}

              <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition-all"
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}