'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

import {
  ArrowLeft,
  BookOpen,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  ListFilter,
  Calendar,
  GraduationCap,
  X,
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

interface StatusState {
  success?: boolean
  msg?: string
}

// ============================================================
// COMPONENT
// ============================================================

export default function ManageHomeworkPage() {
  const router = useRouter()

  // ==========================================================
  // VIEW
  // ==========================================================

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // ==========================================================
  // DATA
  // ==========================================================

  const [homeworkList, setHomeworkList] = useState<HomeworkData[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectData[]>([])

  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(true)

  // ==========================================================
  // FILTER
  // ==========================================================

  const [filterSubjectId, setFilterSubjectId] = useState('')

  // ==========================================================
  // FORM
  // ==========================================================

  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(
    null
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [status, setStatus] = useState<StatusState>({})

  // ==========================================================
  // FETCH SUBJECTS
  // ==========================================================

  const fetchSubjects = useCallback(async () => {
    setIsFetchingSubjects(true)

    try {
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
    } catch (error: unknown) {
      console.error('fetchSubjects error:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data mata pelajaran.'

      setStatus({
        success: false,
        msg: message,
      })
    } finally {
      setIsFetchingSubjects(false)
    }
  }, [])

  // ==========================================================
  // FETCH HOMEWORK
  // ==========================================================

  const fetchHomeworks = useCallback(async () => {
    setIsFetching(true)

    try {
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
    } catch (error: unknown) {
      console.error('fetchHomeworks error:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data pekerjaan rumah.'

      setStatus({
        success: false,
        msg: message,
      })
    } finally {
      setIsFetching(false)
    }
  }, [])

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchSubjects()
    fetchHomeworks()
  }, [fetchSubjects, fetchHomeworks])

  // ==========================================================
  // SUBJECT NAME
  // ==========================================================

  const getSubjectName = useCallback(
    (homework: HomeworkData) => {
      if (homework.subject_id) {
        const subject = subjectsList.find(
          (item) => item.id === homework.subject_id
        )

        if (subject) {
          return subject.name
        }
      }

      // Fallback data lama
      return homework.mapel || 'Tanpa Mata Pelajaran'
    },
    [subjectsList]
  )

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '-'
    }

    try {
      const date = new Date(dateString)

      if (Number.isNaN(date.getTime())) {
        return dateString
      }

      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    } catch {
      return dateString
    }
  }

  // ==========================================================
  // CHECK EXPIRED
  // ==========================================================

  const isPastDue = (dueDateValue: string | null) => {
    if (!dueDateValue) {
      return false
    }

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const due = new Date(`${dueDateValue}T00:00:00`)

    due.setHours(0, 0, 0, 0)

    return due < today
  }

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setEditingHomeworkId(null)
    setTitle('')
    setDescription('')
    setSelectedSubjectId('')
    setDueDate('')
  }

  // ==========================================================
  // RESET EVERYTHING
  // ==========================================================

  const resetFormToInitial = () => {
    resetForm()
    setStatus({})
  }

  // ==========================================================
  // CREATE NEW
  // ==========================================================

  const handleCreateNewClick = () => {
    resetFormToInitial()
    setViewMode('form')
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEditClick = (homework: HomeworkData) => {
    setStatus({})

    setEditingHomeworkId(homework.id)

    setTitle(homework.title || '')
    setDescription(homework.description || '')
    setDueDate(homework.due_date || '')

    let subjectId = homework.subject_id || ''

    // Fallback untuk data lama yang hanya memiliki mapel
    if (!subjectId && homework.mapel) {
      const matchedSubject = subjectsList.find(
        (subject) =>
          subject.name.trim().toLowerCase() ===
          homework.mapel?.trim().toLowerCase()
      )

      if (matchedSubject) {
        subjectId = matchedSubject.id
      }
    }

    setSelectedSubjectId(subjectId)

    setViewMode('form')
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDeleteClick = async (id: string) => {
    const homework = homeworkList.find((item) => item.id === id)

    if (!homework) {
      return
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus PR "${homework.title}"?\n\nTindakan ini akan menghapus data PR tersebut secara permanen.`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(id)
    setStatus({})

    try {
      const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setHomeworkList((previous) =>
        previous.filter((item) => item.id !== id)
      )

      setStatus({
        success: true,
        msg: 'Pekerjaan Rumah berhasil dihapus.',
      })
    } catch (error: unknown) {
      console.error('deleteHomework error:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menghapus pekerjaan rumah.'

      setStatus({
        success: false,
        msg: message,
      })
    } finally {
      setDeletingId(null)
    }
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) {
      return
    }

    setIsLoading(true)
    setStatus({})

    try {
      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      const cleanTitle = title.trim()
      const cleanDescription = description.trim()

      if (!cleanTitle) {
        throw new Error('Judul PR wajib diisi.')
      }

      if (cleanTitle.length > 150) {
        throw new Error('Judul PR maksimal 150 karakter.')
      }

      if (!selectedSubjectId) {
        throw new Error('Mata Pelajaran wajib dipilih.')
      }

      if (cleanDescription.length > 2000) {
        throw new Error('Deskripsi maksimal 2000 karakter.')
      }

      // ------------------------------------------------------
      // SUBJECT VALIDATION
      // ------------------------------------------------------

      const selectedSubject = subjectsList.find(
        (subject) => subject.id === selectedSubjectId
      )

      if (!selectedSubject) {
        throw new Error(
          'Mata Pelajaran yang dipilih tidak ditemukan. Silakan refresh halaman.'
        )
      }

      // ------------------------------------------------------
      // USER SESSION
      // ------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'User session tidak valid. Silakan login kembali.'
        )
      }

      // ------------------------------------------------------
      // PAYLOAD
      // ------------------------------------------------------

      const basePayload = {
        title: cleanTitle,
        description: cleanDescription || null,

        // Relasi utama
        subject_id: selectedSubject.id,

        // Kompatibilitas dengan data lama
        mapel: selectedSubject.name,

        due_date: dueDate || null,
      }

      // ======================================================
      // UPDATE
      // ======================================================

      if (editingHomeworkId) {
        const { error } = await supabase
          .from('homework')
          .update(basePayload)
          .eq('id', editingHomeworkId)

        if (error) {
          throw error
        }

        setStatus({
          success: true,
          msg: 'Pekerjaan Rumah berhasil diperbarui!',
        })
      }

      // ======================================================
      // INSERT
      // ======================================================

      else {
        const payload = {
          ...basePayload,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('homework')
          .insert(payload)

        if (error) {
          throw error
        }

        setStatus({
          success: true,
          msg: 'Pekerjaan Rumah baru berhasil diterbitkan!',
        })
      }

      // ------------------------------------------------------
      // REFRESH DATA
      // ------------------------------------------------------

      await fetchHomeworks()

      // ------------------------------------------------------
      // RETURN TO LIST
      // ------------------------------------------------------

      setTimeout(() => {
        resetFormToInitial()
        setViewMode('list')
      }, 800)
    } catch (error: unknown) {
      console.error('handleSubmit error:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memproses database.'

      setStatus({
        success: false,
        msg: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredHomeworkList = useMemo(() => {
    if (!filterSubjectId) {
      return homeworkList
    }

    return homeworkList.filter(
      (homework) => homework.subject_id === filterSubjectId
    )
  }, [homeworkList, filterSubjectId])

  // ==========================================================
  // BACK
  // ==========================================================

  const handleBack = () => {
    if (isLoading || deletingId) {
      return
    }

    if (viewMode === 'form') {
      resetFormToInitial()
      setViewMode('list')
      return
    }

    router.push('/super-admin')
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-purple-600 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading || deletingId !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />

            {viewMode === 'form'
              ? 'Batalkan & Kembali'
              : 'Kembali ke Panel Utama'}
          </button>

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={handleCreateNewClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat PR Baru
            </button>
          )}
        </div>

        {/* ==================================================
            TITLE
        ================================================== */}

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Kelola Pekerjaan Rumah (PR)
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            {viewMode === 'list'
              ? 'Tinjau, kelompokkan, atau perbarui daftar Pekerjaan Rumah berdasarkan Mata Pelajaran.'
              : 'Formulir untuk mempublikasikan PR baru dengan detail tugas serta masa berlaku pengerjaan.'}
          </p>
        </div>

        {/* ==================================================
            STATUS
        ================================================== */}

        {status.msg && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
              status.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {status.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}

            <div className="font-medium flex-1">
              {status.msg}
            </div>

            <button
              type="button"
              onClick={() => setStatus({})}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ==================================================
            VIEWS
        ================================================== */}

        <AnimatePresence mode="wait">

          {/* ==================================================
              LIST VIEW
          ================================================== */}

          {viewMode === 'list' ? (
            <motion.div
              key="list-view"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="space-y-4"
            >

              {/* ==================================================
                  FILTER
              ================================================== */}

              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />

                <label className="text-xs font-bold text-slate-500 shrink-0">
                  Filter Mapel:
                </label>

                <select
                  value={filterSubjectId}
                  onChange={(e) =>
                    setFilterSubjectId(e.target.value)
                  }
                  disabled={isFetchingSubjects}
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all cursor-pointer disabled:opacity-50"
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

                {filterSubjectId && (
                  <button
                    type="button"
                    onClick={() => setFilterSubjectId('')}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                <span className="text-xs text-slate-400 ml-auto">
                  {filteredHomeworkList.length} PR
                </span>
              </div>

              {/* ==================================================
                  SUBJECT LOADING / EMPTY
              ================================================== */}

              {isFetchingSubjects ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />

                  <span className="font-semibold">
                    Mengambil daftar mata pelajaran...
                  </span>
                </div>
              ) : subjectsList.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-bold">
                      Belum ada mata pelajaran.
                    </p>

                    <p className="mt-0.5">
                      Tambahkan mata pelajaran terlebih dahulu
                      melalui Manage Materi.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* ==================================================
                  HOMEWORK LOADING
              ================================================== */}

              {isFetching ? (
                <div className="w-full p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />

                  <span className="text-xs font-bold">
                    Mengambil data PR...
                  </span>
                </div>
              ) : filteredHomeworkList.length === 0 ? (

                /* ==================================================
                   EMPTY
                ================================================== */

                <div className="w-full text-center p-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <ListFilter className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                  <h4 className="text-sm font-bold text-slate-700">
                    Tidak ada PR ditemukan
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {filterSubjectId
                      ? 'Belum ada PR untuk mata pelajaran ini.'
                      : 'Silakan tambahkan Pekerjaan Rumah baru.'}
                  </p>

                  {subjectsList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCreateNewClick}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Buat PR Baru
                    </button>
                  )}
                </div>
              ) : (

                /* ==================================================
                   HOMEWORK LIST
                ================================================== */

                <div className="grid grid-cols-1 gap-3">
                  {filteredHomeworkList.map((homework) => {
                    const subjectName =
                      getSubjectName(homework)

                    const expired = isPastDue(
                      homework.due_date
                    )

                    return (
                      <motion.div
                        layout
                        key={homework.id}
                        className="border border-slate-200/70 p-5 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all"
                      >

                        {/* INFO */}

                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">

                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                              <BookOpen className="w-2.5 h-2.5" />
                              {subjectName}
                            </span>

                            {homework.due_date && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  expired
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-slate-500 bg-slate-100'
                                }`}
                              >
                                <Calendar className="w-2.5 h-2.5" />

                                {expired
                                  ? 'Lewat tenggat:'
                                  : 'Tenggat:'}{' '}

                                {formatDate(
                                  homework.due_date
                                )}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-black text-slate-900 truncate">
                            {homework.title}
                          </h4>

                          {homework.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {homework.description}
                            </p>
                          )}

                          <p className="text-[10px] text-slate-400">
                            Dibuat:{' '}
                            {formatDate(
                              homework.created_at
                            )}
                          </p>
                        </div>

                        {/* ACTION */}

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(homework)
                            }
                            disabled={
                              isLoading ||
                              deletingId !== null
                            }
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 flex items-center justify-center border border-slate-200/40 hover:border-purple-200 transition-all cursor-pointer disabled:opacity-50"
                            title="Ubah PR"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteClick(
                                homework.id
                              )
                            }
                            disabled={
                              isLoading ||
                              deletingId !== null
                            }
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center border border-slate-200/40 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                            title="Hapus PR"
                          >
                            {deletingId === homework.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ) : (

            /* ==================================================
               FORM VIEW
            ================================================== */

            <motion.form
              key="form-view"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* ==================================================
                  FORM CARD
              ================================================== */}

              <div className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs">

                {/* HEADER */}

                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <BookOpen className="w-4 h-4" />
                  </div>

                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Detail Pekerjaan Rumah{' '}
                    {editingHomeworkId &&
                      '(Mode Ubah)'}
                  </h3>
                </div>

                {/* ==================================================
                    TITLE
                ================================================== */}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Judul PR
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                    placeholder="Contoh: Homework 1 - Narrative Essay Writing"
                    required
                    disabled={isLoading}
                  />

                  <div className="text-right text-[10px] text-slate-400">
                    {title.length}/150
                  </div>
                </div>

                {/* ==================================================
                    SUBJECT
                ================================================== */}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mata Pelajaran
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>

                  <select
                    value={selectedSubjectId}
                    onChange={(e) =>
                      setSelectedSubjectId(
                        e.target.value
                      )
                    }
                    disabled={
                      isFetchingSubjects ||
                      isLoading
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all cursor-pointer disabled:opacity-60"
                    required
                  >
                    <option value="">
                      {isFetchingSubjects
                        ? 'Mengambil mata pelajaran...'
                        : 'Pilih Mata Pelajaran'}
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

                  <p className="text-[10px] text-slate-400">
                    Mata pelajaran diambil langsung dari daftar{' '}
                    <span className="font-bold text-slate-500">
                      Subjects
                    </span>{' '}
                    yang digunakan oleh materi.
                  </p>
                </div>

                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Deskripsi / Detail Tugas
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    rows={5}
                    maxLength={2000}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all resize-y disabled:bg-slate-50"
                    placeholder="Tuliskan petunjuk tugas untuk dikerjakan siswa..."
                  />

                  <div className="text-right text-[10px] text-slate-400">
                    {description.length}/2000
                  </div>
                </div>

                {/* ==================================================
                    DUE DATE
                ================================================== */}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tenggat Waktu Pengerjaan
                    <span className="text-[10px] font-medium text-slate-400 ml-1">
                      (Opsional)
                    </span>
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) =>
                      setDueDate(e.target.value)
                    }
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all disabled:bg-slate-50"
                  />

                  {dueDate && (
                    <p className="text-[11px] text-slate-400">
                      Tenggat:{' '}
                      <span className="font-bold text-slate-600">
                        {formatDate(dueDate)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* ==================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  isFetchingSubjects ||
                  subjectsList.length === 0
                }
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-purple-200 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sedang Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />

                    {editingHomeworkId
                      ? 'Perbarui PR'
                      : 'Terbitkan PR Sekarang'}
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}