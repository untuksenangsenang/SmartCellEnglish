'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Music,
  HelpCircle,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Edit3,
  Trash2,
  ListFilter,
  GraduationCap,
  ClipboardCheck,
  Clock
} from 'lucide-react'

// ============================================================
// INTERFACES & TYPES
// ============================================================

interface SubjectData {
  id: string
  name: string
}

interface QuestionStructure {
  question: string
  options?: string[]
  correct_answer?: string
  type?: 'multiple_choice' | 'essay'
  answer_key?: string
}

interface CorrectionSummary {
  total: number
  corrected: number
  pending: number
}

interface ModuleData {
  id: string
  created_at?: string
  title: string
  content_text: string | null
  audio_url: string | null
  file_url: string | null
  file_type: string | null
  subject_id: string | null
  subjects?: { name: string } | null
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================

export default function ManageMateriPage() {
  const router = useRouter()
  const supabase = createClient()

  // ── View Mode ──────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // ── Data Utama ─────────────────────────────────────────────
  const [modulesList, setModulesList] = useState<ModuleData[]>([])
  const [isFetching, setIsFetching] = useState(true)

  // ── Data Mata Pelajaran ────────────────────────────────────
  const [subjectsList, setSubjectsList] = useState<SubjectData[]>([])
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(true)

  // ── Filter List ────────────────────────────────────────────
  const [filterSubjectId, setFilterSubjectId] = useState<string>('')

  // ── Ringkasan Koreksi ──────────────────────────────────────
  const [correctionMap, setCorrectionMap] = useState<
    Record<string, CorrectionSummary>
  >({})

  // ── State Edit Mode ────────────────────────────────────────
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  // ── Tipe Konten Form ───────────────────────────────────────
  const [contentType, setContentType] = useState<'text' | 'file'>('text')
  const [isDragActive, setIsDragActive] = useState(false)

  // ── Form: Data Modul ───────────────────────────────────────
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleContent, setModuleContent] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [fileDoc, setFileDoc] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [existingFileType, setExistingFileType] = useState<string | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

  // ── Form: Data Kuis ────────────────────────────────────────
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionStructure[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      type: 'multiple_choice',
      answer_key: ''
    }
  ])

  // ── UI Feedback ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    success?: boolean
    msg?: string
  }>({})

  // ============================================================
  // [READ] FETCH MATA PELAJARAN
  // ============================================================

  const fetchSubjects = useCallback(async () => {
    setIsFetchingSubjects(true)

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error

      setSubjectsList(data || [])
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data subjects'

      console.error('fetchSubjects error:', msg)
    } finally {
      setIsFetchingSubjects(false)
    }
  }, [supabase])

  // ============================================================
  // [READ] FETCH RINGKASAN KOREKSI
  //
  // RELASI DATABASE:
  //
  // quizzes.id
  //     ↓
  // quiz_attempts.quiz_id
  //     ↓
  // quiz_answers.attempt_id
  //
  // Status koreksi:
  // quiz_answers.is_corrected
  // ============================================================

  const fetchCorrectionSummaries = useCallback(
    async (modules: ModuleData[]) => {
      try {
        const moduleIds = Array.from(
          new Set(modules.map((m) => m.id).filter(Boolean))
        )

        if (moduleIds.length === 0) {
          setCorrectionMap({})
          return
        }

        // --------------------------------------------------------
        // STEP 1:
        // Ambil semua quiz berdasarkan module_id
        // --------------------------------------------------------

        const {
          data: quizzesData,
          error: quizError
        } = await supabase
          .from('quizzes')
          .select('id, module_id')
          .in('module_id', moduleIds)

        if (quizError) {
          console.warn(
            'Gagal mengambil quizzes untuk ringkasan koreksi:',
            quizError.message
          )
          return
        }

        if (!quizzesData || quizzesData.length === 0) {
          setCorrectionMap({})
          return
        }

        const quizIds = quizzesData
          .map((quiz) => quiz.id)
          .filter(Boolean)

        if (quizIds.length === 0) {
          setCorrectionMap({})
          return
        }

        // Map quiz_id → module_id
        const quizModuleMap: Record<string, string> = {}

        quizzesData.forEach((quiz) => {
          if (quiz.id && quiz.module_id) {
            quizModuleMap[quiz.id] = quiz.module_id
          }
        })

        // --------------------------------------------------------
        // STEP 2:
        // Ambil quiz_attempts berdasarkan quiz_id
        // --------------------------------------------------------

        const {
          data: attemptsData,
          error: attemptsError
        } = await supabase
          .from('quiz_attempts')
          .select('id, quiz_id')
          .in('quiz_id', quizIds)

        if (attemptsError) {
          console.warn(
            'Gagal mengambil quiz_attempts:',
            attemptsError.message
          )
          return
        }

        if (!attemptsData || attemptsData.length === 0) {
          setCorrectionMap({})
          return
        }

        const attemptIds = attemptsData
          .map((attempt) => attempt.id)
          .filter(Boolean)

        if (attemptIds.length === 0) {
          setCorrectionMap({})
          return
        }

        // Map attempt_id → module_id
        const attemptModuleMap: Record<string, string> = {}

        attemptsData.forEach((attempt) => {
          const moduleId = quizModuleMap[attempt.quiz_id]

          if (attempt.id && moduleId) {
            attemptModuleMap[attempt.id] = moduleId
          }
        })

        // --------------------------------------------------------
        // STEP 3:
        // Ambil quiz_answers berdasarkan attempt_id
        // --------------------------------------------------------

        const {
          data: answersData,
          error: answersError
        } = await supabase
          .from('quiz_answers')
          .select('id, attempt_id, is_corrected')
          .in('attempt_id', attemptIds)

        if (answersError) {
          console.warn(
            'Gagal mengambil quiz_answers:',
            answersError.message
          )
          return
        }

        if (!answersData || answersData.length === 0) {
          setCorrectionMap({})
          return
        }

        // --------------------------------------------------------
        // STEP 4:
        // Bangun summary berdasarkan module_id
        // --------------------------------------------------------

        const summaryMap: Record<string, CorrectionSummary> = {}

        answersData.forEach((answer) => {
          const moduleId = attemptModuleMap[answer.attempt_id]

          if (!moduleId) return

          if (!summaryMap[moduleId]) {
            summaryMap[moduleId] = {
              total: 0,
              corrected: 0,
              pending: 0
            }
          }

          summaryMap[moduleId].total++

          if (answer.is_corrected === true) {
            summaryMap[moduleId].corrected++
          } else {
            summaryMap[moduleId].pending++
          }
        })

        setCorrectionMap(summaryMap)
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unknown error'

        console.warn(
          'fetchCorrectionSummaries dilewati karena error non-kritis:',
          msg
        )
      }
    },
    [supabase]
  )

  // ============================================================
  // [READ] FETCH SEMUA MODUL
  // ============================================================

  const fetchModules = useCallback(async () => {
    setIsFetching(true)

    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const modules = (data || []) as ModuleData[]

      setModulesList(modules)

      if (modules.length > 0) {
        await fetchCorrectionSummaries(modules)
      } else {
        setCorrectionMap({})
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data'

      console.error('fetchModules error:', msg)
    } finally {
      setIsFetching(false)
    }
  }, [supabase, fetchCorrectionSummaries])

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchModules()
    fetchSubjects()
  }, [fetchModules, fetchSubjects])

  // ============================================================
  // HELPER: RESET FORM
  // ============================================================

  const resetFormToInitial = () => {
    setEditingModuleId(null)
    setEditingQuizId(null)

    setModuleTitle('')
    setModuleContent('')
    setAudioUrl('')

    setFileDoc(null)
    setExistingFileUrl(null)
    setExistingFileType(null)

    setSelectedSubjectId('')

    setQuizTitle('')
    setContentType('text')

    setQuestions([
      {
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        type: 'multiple_choice',
        answer_key: ''
      }
    ])

    setViewMode('list')
    setStatus({})
  }

  // ============================================================
  // EDIT HANDLER
  // ============================================================

  const handleEditClick = async (module: ModuleData) => {
    setIsLoading(true)
    setStatus({})
    setEditingModuleId(module.id)

    setModuleTitle(module.title)
    setSelectedSubjectId(module.subject_id || '')

    if (module.file_url) {
      setContentType('file')
      setExistingFileUrl(module.file_url)
      setExistingFileType(module.file_type)
      setModuleContent('')
      setAudioUrl('')
    } else {
      setContentType('text')
      setModuleContent(module.content_text || '')
      setAudioUrl(module.audio_url || '')
      setExistingFileUrl(null)
      setExistingFileType(null)
    }

    try {
      const {
        data: quizData,
        error: quizError
      } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', module.id)
        .maybeSingle()

      if (quizError) throw quizError

      if (quizData) {
        setEditingQuizId(quizData.id)
        setQuizTitle(quizData.title)

        const mappedQuestions = (quizData.questions || []).map(
          (q: QuestionStructure) => ({
            question: q.question || '',
            options: q.options || ['', '', '', ''],
            correct_answer: q.correct_answer || '',
            type: q.type || 'multiple_choice',
            answer_key: q.answer_key || ''
          })
        )

        setQuestions(
          mappedQuestions.length > 0
            ? mappedQuestions
            : [
                {
                  question: '',
                  options: ['', '', '', ''],
                  correct_answer: '',
                  type: 'multiple_choice',
                  answer_key: ''
                }
              ]
        )
      } else {
        setEditingQuizId(null)
        setQuizTitle('')

        setQuestions([
          {
            question: '',
            options: ['', '', '', ''],
            correct_answer: '',
            type: 'multiple_choice',
            answer_key: ''
          }
        ])
      }

      setViewMode('form')
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data kuis'

      console.error(err)

      alert(
        `Gagal mengambil data kuis pelengkap: ${msg}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // DELETE HANDLER
  // ============================================================

  const handleDeleteClick = async (moduleId: string) => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus modul ini beserta kuis di dalamnya?'
      )
    ) {
      return
    }

    try {
      // Hapus quiz terlebih dahulu
      const {
        error: quizDelError
      } = await supabase
        .from('quizzes')
        .delete()
        .eq('module_id', moduleId)

      if (quizDelError) throw quizDelError

      // Kemudian hapus module
      const {
        error: moduleDelError
      } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (moduleDelError) throw moduleDelError

      alert('Materi dan kuis berhasil dieliminasi dari sistem.')

      fetchModules()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menghapus'

      console.error(err)

      alert(`Gagal menghapus data: ${msg}`)
    }
  }

  // ============================================================
  // DYNAMIC SOAL LOGIC
  // ============================================================

  const addQuestionField = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        type: 'multiple_choice',
        answer_key: ''
      }
    ])
  }

  const removeQuestionField = (index: number) => {
    if (questions.length === 1) {
      alert('Kuis minimal harus memiliki 1 pertanyaan!')
      return
    }

    setQuestions(
      questions.filter((_, i) => i !== index)
    )
  }

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string,
    optionIndex?: number
  ) => {
    const updatedQuestions = [...questions]

    if (field === 'question') {
      updatedQuestions[index].question = value
    }

    else if (field === 'correct_answer') {
      updatedQuestions[index].correct_answer = value
    }

    else if (field === 'type') {
      updatedQuestions[index].type =
        value as 'multiple_choice' | 'essay'

      if (value === 'essay') {
        updatedQuestions[index].options = []
        updatedQuestions[index].correct_answer = ''
      } else {
        updatedQuestions[index].options = [
          '',
          '',
          '',
          ''
        ]

        updatedQuestions[index].correct_answer = ''
        updatedQuestions[index].answer_key = ''
      }
    }

    else if (field === 'answer_key') {
      updatedQuestions[index].answer_key = value
    }

    else if (
      field === 'option' &&
      optionIndex !== undefined
    ) {
      const opts =
        updatedQuestions[index].options ||
        ['', '', '', '']

      opts[optionIndex] = value

      updatedQuestions[index].options = opts
    }

    setQuestions(updatedQuestions)
  }

  // ============================================================
  // SUBMIT HANDLER
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setIsLoading(true)
    setStatus({})

    try {
      // --------------------------------------------------------
      // VALIDASI SUBJECT
      // --------------------------------------------------------

      if (!selectedSubjectId) {
        throw new Error(
          'Mata Pelajaran wajib dipilih!'
        )
      }

      // --------------------------------------------------------
      // VALIDASI SOAL
      // --------------------------------------------------------

      for (const q of questions) {
        if (!q.question.trim()) {
          throw new Error(
            'Semua kolom soal wajib diisi!'
          )
        }

        if (
          (q.type || 'multiple_choice') ===
          'multiple_choice'
        ) {
          if (
            !q.correct_answer ||
            !q.options ||
            q.options.some(
              (opt) => !opt.trim()
            )
          ) {
            throw new Error(
              'Semua kolom pilihan ganda dan kunci jawaban wajib ditentukan!'
            )
          }
        }
      }

      // --------------------------------------------------------
      // UPLOAD FILE
      // --------------------------------------------------------

      let uploadedFileUrl =
        existingFileUrl

      let uploadedFileType =
        existingFileType

      if (contentType === 'file') {
        if (!fileDoc && !existingFileUrl) {
          throw new Error(
            'Silakan pilih atau jatuhkan file PDF/Word terlebih dahulu!'
          )
        }

        if (fileDoc) {
          const fileExt =
            fileDoc.name
              .split('.')
              .pop()
              ?.toLowerCase() || ''

          const fileName =
            `${Date.now()}.${fileExt}`

          const filePath =
            `documents/${fileName}`

          const {
            error: uploadError
          } = await supabase.storage
            .from('modules')
            .upload(
              filePath,
              fileDoc
            )

          if (uploadError) {
            throw uploadError
          }

          const {
            data: {
              publicUrl
            }
          } = supabase.storage
            .from('modules')
            .getPublicUrl(filePath)

          uploadedFileUrl =
            publicUrl

          uploadedFileType =
            fileExt
        }
      }

      // --------------------------------------------------------
      // MODULE PAYLOAD
      // --------------------------------------------------------

      let activeModuleId =
        editingModuleId

      const modulePayload = {
        title: moduleTitle,
        content_text:
          contentType === 'text'
            ? moduleContent
            : '',
        audio_url:
          contentType === 'text'
            ? audioUrl || null
            : null,
        file_url:
          contentType === 'file'
            ? uploadedFileUrl
            : null,
        file_type:
          contentType === 'file'
            ? uploadedFileType
            : null,
        subject_id:
          selectedSubjectId || null
      }

      // --------------------------------------------------------
      // UPDATE MODULE
      // --------------------------------------------------------

      if (editingModuleId) {
        const {
          error: moduleUpdateError
        } = await supabase
          .from('modules')
          .update(modulePayload)
          .eq(
            'id',
            editingModuleId
          )

        if (moduleUpdateError) {
          throw moduleUpdateError
        }
      }

      // --------------------------------------------------------
      // INSERT MODULE
      // --------------------------------------------------------

      else {
        const {
          data: moduleData,
          error: moduleError
        } = await supabase
          .from('modules')
          .insert(modulePayload)
          .select()
          .single()

        if (moduleError) {
          throw moduleError
        }

        activeModuleId =
          moduleData.id
      }

      // --------------------------------------------------------
      // QUIZ PAYLOAD
      // --------------------------------------------------------

      const quizPayload = {
        module_id:
          activeModuleId,
        title:
          quizTitle ||
          `Kuis: ${moduleTitle}`,
        questions:
          questions,
        subject_id:
          selectedSubjectId || null
      }

      // --------------------------------------------------------
      // UPDATE QUIZ
      // --------------------------------------------------------

      if (editingQuizId) {
        const {
          error: quizUpdateError
        } = await supabase
          .from('quizzes')
          .update(quizPayload)
          .eq(
            'id',
            editingQuizId
          )

        if (quizUpdateError) {
          throw quizUpdateError
        }
      }

      // --------------------------------------------------------
      // INSERT QUIZ
      // --------------------------------------------------------

      else {
        const {
          error: quizError
        } = await supabase
          .from('quizzes')
          .insert(quizPayload)

        if (quizError) {
          throw quizError
        }
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setStatus({
        success: true,
        msg: editingModuleId
          ? 'Perubahan materi & paket kuis berhasil diperbarui!'
          : 'Modul Pembelajaran & Paket Kuis baru berhasil diterbitkan!'
      })

      setTimeout(() => {
        fetchModules()
        resetFormToInitial()
      }, 1500)

    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Gagal memproses operasi database.'

      console.error(error)

      setStatus({
        success: false,
        msg
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // COMPUTED
  // ============================================================

  const filteredModulesList =
    modulesList.filter((mod) =>
      filterSubjectId
        ? mod.subject_id ===
          filterSubjectId
        : true
    )

  // ============================================================
  // CORRECTION BADGE
  // ============================================================

  const getCorrectionBadge = (
    moduleId: string
  ) => {
    const summary =
      correctionMap[moduleId]

    if (
      !summary ||
      summary.total === 0
    ) {
      return null
    }

    if (summary.pending === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
          <ClipboardCheck className="w-2.5 h-2.5" />
          Semua Terkoreksi ({summary.total})
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
        <Clock className="w-2.5 h-2.5" />
        {summary.pending} Belum Dikoreksi
      </span>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-purple-600 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'form') {
                resetFormToInitial()
              } else {
                router.push('/super-admin')
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />

            {viewMode === 'form'
              ? 'Batalkan & Kembali ke List'
              : 'Kembali ke Panel Utama'}
          </button>

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => {
                setStatus({})
                setViewMode('form')
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Modul Baru
            </button>
          )}
        </div>

        {/* TITLE */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            CMS: Manajemen Modul & Kuis
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            {viewMode === 'list'
              ? 'Kelola, perbarui, atau eliminasi seluruh pustaka materi microlearning yang telah mengudara.'
              : 'Formulir modifikasi satu pintu untuk mempublikasikan materi microlearning interaktif.'}
          </p>
        </div>

        {/* VIEWS */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (

            /* ==================================================
               LIST VIEW
               ================================================== */

            <motion.div
              key="list-view"
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              className="space-y-4"
            >

              {/* FILTER */}
              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />

                <label className="text-xs font-bold text-slate-500 shrink-0">
                  Filter Mapel:
                </label>

                <select
                  value={filterSubjectId}
                  onChange={(e) =>
                    setFilterSubjectId(
                      e.target.value
                    )
                  }
                  disabled={
                    isFetchingSubjects
                  }
                  className="flex-1 min-w-[160px] rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    Semua Mata Pelajaran
                  </option>

                  {subjectsList.map(
                    (s) => (
                      <option
                        key={s.id}
                        value={s.id}
                      >
                        {s.name}
                      </option>
                    )
                  )}
                </select>

                {filterSubjectId && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilterSubjectId('')
                    }
                    className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                <span className="text-xs text-slate-400 ml-auto">
                  {filteredModulesList.length}{' '}
                  modul ditampilkan
                </span>
              </div>

              {/* LOADING */}
              {isFetching ? (
                <div className="w-full p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />

                  <span className="text-xs font-bold">
                    Sinkronisasi data database...
                  </span>
                </div>

              ) : filteredModulesList.length === 0 ? (

                /* EMPTY */
                <div className="w-full text-center p-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <ListFilter className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                  <h4 className="text-sm font-bold text-slate-700">
                    {filterSubjectId
                      ? 'Tidak ada modul untuk mata pelajaran ini'
                      : 'Belum ada modul yang terbit'}
                  </h4>
                </div>

              ) : (

                /* MODULE LIST */
                <div className="grid grid-cols-1 gap-3">
                  {filteredModulesList.map(
                    (mod) => (
                      <div
                        key={mod.id}
                        className="border border-slate-200/70 p-4 rounded-2xl bg-white flex items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all"
                      >

                        <div className="space-y-1.5 min-w-0 flex-1">

                          <div className="flex items-center gap-1.5 flex-wrap">

                            {mod.file_url ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                                <FileText className="w-2.5 h-2.5" />
                                File {mod.file_type}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                                <BookOpen className="w-2.5 h-2.5" />
                                Teks & Audio
                              </span>
                            )}

                            {mod.subjects?.name && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                <GraduationCap className="w-2.5 h-2.5" />
                                {mod.subjects.name}
                              </span>
                            )}

                            {getCorrectionBadge(
                              mod.id
                            )}

                          </div>

                          <h4 className="text-sm font-black text-slate-900 truncate pr-2">
                            {mod.title}
                          </h4>

                        </div>

                        {/* ACTION */}
                        <div className="flex items-center gap-1.5 shrink-0">

                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(
                                mod
                              )
                            }
                            disabled={
                              isLoading
                            }
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 flex items-center justify-center border border-slate-200/40 hover:border-purple-200 transition-all cursor-pointer disabled:opacity-50"
                            title="Ubah Materi"
                          >
                            {isLoading &&
                            editingModuleId ===
                              mod.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Edit3 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteClick(
                                mod.id
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center border border-slate-200/40 hover:border-red-200 transition-all cursor-pointer"
                            title="Hapus Materi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </div>
                    )
                  )}
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
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >

              {/* ==================================================
                 BAGIAN 1: MATERI
                 ================================================== */}

              <div className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <BookOpen className="w-4 h-4" />
                    </div>

                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Bagian 1: Materi Microlearning{' '}
                      {editingModuleId &&
                        '(Mode Ubah)'}
                    </h3>
                  </div>

                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">

                    <button
                      type="button"
                      disabled={
                        editingModuleId !== null
                      }
                      onClick={() =>
                        setContentType(
                          'text'
                        )
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${
                        contentType ===
                        'text'
                          ? 'bg-white text-purple-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      Teks & Audio
                    </button>

                    <button
                      type="button"
                      disabled={
                        editingModuleId !== null
                      }
                      onClick={() =>
                        setContentType(
                          'file'
                        )
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${
                        contentType ===
                        'file'
                          ? 'bg-white text-purple-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      File Dokumen
                    </button>

                  </div>
                </div>

                {/* SUBJECT */}
                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    Mata Pelajaran{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      selectedSubjectId
                    }
                    onChange={(e) =>
                      setSelectedSubjectId(
                        e.target.value
                      )
                    }
                    required
                    disabled={
                      isFetchingSubjects
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all cursor-pointer"
                  >
                    <option value="">
                      -- Pilih Mata Pelajaran --
                    </option>

                    {subjectsList.map(
                      (s) => (
                        <option
                          key={s.id}
                          value={s.id}
                        >
                          {s.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* JUDUL MODUL */}
                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-slate-700">
                    Judul Materi Pembelajaran{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      moduleTitle
                    }
                    onChange={(e) =>
                      setModuleTitle(
                        e.target.value
                      )
                    }
                    placeholder="Misal: Pengenalan Dasar Pemrograman Python"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                  />
                </div>

                {/* CONTENT TEXT */}
                {contentType === 'text' ? (
                  <>
                    <div className="space-y-1.5">

                      <label className="text-xs font-bold text-slate-700">
                        Konten Penjelasan Teks
                      </label>

                      <textarea
                        rows={5}
                        value={
                          moduleContent
                        }
                        onChange={(e) =>
                          setModuleContent(
                            e.target.value
                          )
                        }
                        placeholder="Tuliskan rangkuman materi lengkap di sini..."
                        className="w-full rounded-xl border border-slate-200 p-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-slate-400" />
                        URL Audio Podcasting (Opsional)
                      </label>

                      <input
                        type="url"
                        value={
                          audioUrl
                        }
                        onChange={(e) =>
                          setAudioUrl(
                            e.target.value
                          )
                        }
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                      />

                    </div>
                  </>
                ) : (

                  /* FILE */
                  <div className="space-y-2">

                    <label className="text-xs font-bold text-slate-700">
                      Unggah File PDF / Word Document
                    </label>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragActive(
                          true
                        )
                      }}
                      onDragLeave={() =>
                        setIsDragActive(
                          false
                        )
                      }
                      onDrop={(e) => {
                        e.preventDefault()

                        setIsDragActive(
                          false
                        )

                        if (
                          e.dataTransfer
                            .files?.[0]
                        ) {
                          setFileDoc(
                            e.dataTransfer
                              .files[0]
                          )
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragActive
                          ? 'border-purple-500 bg-purple-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >

                      <UploadCloud className="w-8 h-8 text-purple-500 mx-auto mb-2" />

                      <p className="text-xs font-bold text-slate-700">
                        {fileDoc
                          ? fileDoc.name
                          : existingFileUrl
                            ? 'File lama terlampir (upload baru untuk mengganti)'
                            : 'Tarik & lepas file ke sini'}
                      </p>

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          setFileDoc(
                            e.target.files[0]
                          )
                        }
                        className="hidden"
                        id="doc-upload-input"
                      />

                      <label
                        htmlFor="doc-upload-input"
                        className="mt-3 inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50 cursor-pointer shadow-2xs"
                      >
                        Pilih File Dari Komputer
                      </label>

                    </div>
                  </div>
                )}

              </div>

              {/* ==================================================
                 BAGIAN 2: KUIS
                 ================================================== */}

              <div className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-6 shadow-xs">

                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">

                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <HelpCircle className="w-4 h-4" />
                  </div>

                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Bagian 2: Evaluasi & Paket Soal Kuis
                  </h3>

                </div>

                {/* JUDUL KUIS */}
                <div className="space-y-1.5">

                  <label className="text-xs font-bold text-slate-700">
                    Judul Paket Kuis
                  </label>

                  <input
                    type="text"
                    value={
                      quizTitle
                    }
                    onChange={(e) =>
                      setQuizTitle(
                        e.target.value
                      )
                    }
                    placeholder={`Misal: Evaluasi ${moduleTitle || 'Materi'}`}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                  />

                </div>

                {/* QUESTIONS */}
                <div className="space-y-4">

                  {questions.map(
                    (q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-3"
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-xs font-black text-slate-700 uppercase">
                            Soal #{qIndex + 1}
                          </span>

                          <div className="flex items-center gap-2">

                            <select
                              value={
                                q.type ||
                                'multiple_choice'
                              }
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  'type',
                                  e.target.value
                                )
                              }
                              className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
                            >
                              <option value="multiple_choice">
                                Pilihan Ganda
                              </option>

                              <option value="essay">
                                Essay / Uraian
                              </option>
                            </select>

                            {questions.length >
                              1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeQuestionField(
                                    qIndex
                                  )
                                }
                                className="text-xs text-red-500 font-bold hover:underline"
                              >
                                Hapus
                              </button>
                            )}

                          </div>
                        </div>

                        {/* QUESTION */}
                        <input
                          type="text"
                          required
                          value={
                            q.question
                          }
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              'question',
                              e.target.value
                            )
                          }
                          placeholder="Tuliskan pertanyaan soal..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 bg-white"
                        />

                        {/* ESSAY */}
                        {q.type ===
                        'essay' ? (

                          <div className="space-y-1">

                            <label className="text-[11px] font-bold text-slate-500">
                              Panduan Kunci Jawaban Essay (Pedoman Korektor)
                            </label>

                            <textarea
                              rows={2}
                              value={
                                q.answer_key ||
                                ''
                              }
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  'answer_key',
                                  e.target.value
                                )
                              }
                              placeholder="Masukkan kata kunci atau poin-poin penilai..."
                              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 bg-white"
                            />

                          </div>

                        ) : (

                          /* MULTIPLE CHOICE */
                          <div className="space-y-2">

                            <label className="text-[11px] font-bold text-slate-500">
                              Pilihan Jawaban (Tentukan Kunci Jawaban)
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                              {(
                                q.options ||
                                [
                                  '',
                                  '',
                                  '',
                                  ''
                                ]
                              ).map(
                                (
                                  opt,
                                  optIdx
                                ) => (
                                  <div
                                    key={
                                      optIdx
                                    }
                                    className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-lg"
                                  >

                                    <input
                                      type="radio"
                                      name={`correct_ans_${qIndex}`}
                                      checked={
                                        q.correct_answer ===
                                          opt &&
                                        opt !==
                                          ''
                                      }
                                      onChange={() =>
                                        handleQuestionChange(
                                          qIndex,
                                          'correct_answer',
                                          opt
                                        )
                                      }
                                      className="w-3.5 h-3.5 text-purple-600"
                                    />

                                    <input
                                      type="text"
                                      value={
                                        opt
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        handleQuestionChange(
                                          qIndex,
                                          'option',
                                          e.target
                                            .value,
                                          optIdx
                                        )
                                      }
                                      placeholder={`Opsi ${String.fromCharCode(
                                        65 +
                                          optIdx
                                      )}`}
                                      className="w-full text-xs font-medium text-slate-800 focus:outline-none"
                                    />

                                  </div>
                                )
                              )}

                            </div>
                          </div>
                        )}

                      </div>
                    )
                  )}

                  {/* ADD QUESTION */}
                  <button
                    type="button"
                    onClick={
                      addQuestionField
                    }
                    className="w-full py-2.5 border-2 border-dashed border-purple-200 hover:border-purple-400 text-purple-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Pertanyaan Kuis
                  </button>

                </div>
              </div>

              {/* ==================================================
                 STATUS
                 ================================================== */}

              {status.msg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    status.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >

                  {status.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}

                  <span>
                    {status.msg}
                  </span>

                </div>
              )}

              {/* ==================================================
                 SUBMIT
                 ================================================== */}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >

                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}

                {editingModuleId
                  ? 'Simpan Perubahan Modul & Kuis'
                  : 'Terbitkan Modul & Kuis Baru'}

              </button>

            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}