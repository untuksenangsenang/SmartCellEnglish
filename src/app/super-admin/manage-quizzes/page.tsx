'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  ListFilter,
  GraduationCap,
  X,
  PenLine,
  HelpCircle,
  FileText,
} from 'lucide-react'

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
  max_points?: number
}

interface QuizData {
  id: string
  created_at?: string
  title: string
  questions: QuestionStructure[]
  subject_id?: string | null
  module_id?: string | null
}

interface StatusState {
  success?: boolean
  msg?: string
}

const createEmptyQuestion = (): QuestionStructure => ({
  question: '',
  options: ['', '', '', ''],
  correct_answer: '',
  type: 'multiple_choice',
  answer_key: '',
  max_points: 10,
})

export default function ManageQuizzesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [quizzesList, setQuizzesList] = useState<QuizData[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectData[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(true)

  const [filterSubjectId, setFilterSubjectId] = useState('')

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [questions, setQuestions] = useState<QuestionStructure[]>([
    createEmptyQuestion(),
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<StatusState>({})

  const fetchSubjects = useCallback(async () => {
    setIsFetchingSubjects(true)

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setSubjectsList((data || []) as SubjectData[])
    } catch (error) {
      console.error('fetchSubjects error:', error)
    } finally {
      setIsFetchingSubjects(false)
    }
  }, [supabase])

  const fetchQuizzes = useCallback(async () => {
    setIsFetching(true)

    try {
      /*
       * ManageQuizzes = KUIS MANDIRI.
       * Quiz yang terhubung ke materi memiliki module_id,
       * sedangkan quiz mandiri memiliki module_id NULL.
       *
       * Hanya mengambil kolom yang benar-benar ada pada tabel
       * sesuai struktur database yang digunakan:
       * id, module_id, title, questions, created_at, subject_id.
       */
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, module_id, title, questions, created_at, subject_id')
        .is('module_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setQuizzesList((data || []) as QuizData[])
    } catch (error) {
      console.error('fetchQuizzes error:', error)
      setStatus({
        success: false,
        msg: error instanceof Error
          ? error.message
          : 'Gagal mengambil daftar kuis.',
      })
    } finally {
      setIsFetching(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchQuizzes()
    fetchSubjects()
  }, [fetchQuizzes, fetchSubjects])

  useEffect(() => {
    const channel = supabase
      .channel('manage-quizzes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes' },
        () => fetchQuizzes()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => fetchSubjects()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchQuizzes, fetchSubjects])

  const resetForm = () => {
    setEditingQuizId(null)
    setQuizTitle('')
    setSelectedSubjectId('')
    setQuestions([createEmptyQuestion()])
    setStatus({})
    setViewMode('list')
  }

  const addQuestionField = () => {
    setQuestions((current) => [...current, createEmptyQuestion()])
  }

  const removeQuestionField = (index: number) => {
    if (questions.length === 1) {
      alert('Kuis minimal memiliki 1 pertanyaan.')
      return
    }

    setQuestions((current) => current.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (
    index: number,
    field: keyof QuestionStructure | 'option',
    value: string | number,
    optionIndex?: number
  ) => {
    setQuestions((current) => {
      const updated = [...current]
      const question = { ...updated[index] }

      if (field === 'question') {
        question.question = String(value)
      } else if (field === 'correct_answer') {
        question.correct_answer = String(value)
      } else if (field === 'type') {
        question.type = value as 'multiple_choice' | 'essay'

        if (value === 'essay') {
          question.options = []
          question.correct_answer = ''
        } else {
          question.options = ['', '', '', '']
          question.correct_answer = ''
          question.answer_key = ''
          question.max_points = 10
        }
      } else if (field === 'answer_key') {
        question.answer_key = String(value)
      } else if (field === 'max_points') {
        question.max_points = Number(value) || 0
      } else if (field === 'option' && optionIndex !== undefined) {
        const options = [
          ...(question.options || ['', '', '', '']),
        ]
        options[optionIndex] = String(value)
        question.options = options
      }

      updated[index] = question
      return updated
    })
  }

  const handleEditClick = (quiz: QuizData) => {
    setEditingQuizId(quiz.id)
    setQuizTitle(quiz.title)
    setSelectedSubjectId(quiz.subject_id || '')

    const mapped = (quiz.questions || []).map((question) => ({
      question: question.question || '',
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      type: question.type || 'multiple_choice',
      answer_key: question.answer_key || '',
      max_points: question.max_points ?? 10,
    }))

    setQuestions(mapped.length ? mapped : [createEmptyQuestion()])
    setStatus({})
    setViewMode('form')
  }

  const handleDeleteClick = async (quizId: string) => {
    const confirmed = confirm(
      'Hapus kuis ini beserta seluruh attempt dan jawaban siswa yang terkait?'
    )

    if (!confirmed) return

    setIsLoading(true)

    try {
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId)

      if (attemptsError) throw attemptsError

      const attemptIds = (attempts || []).map((attempt) => attempt.id)

      if (attemptIds.length) {
        const { error: answersError } = await supabase
          .from('quiz_answers')
          .delete()
          .in('attempt_id', attemptIds)

        if (answersError) throw answersError

        const { error: attemptsDeleteError } = await supabase
          .from('quiz_attempts')
          .delete()
          .eq('quiz_id', quizId)

        if (attemptsDeleteError) throw attemptsDeleteError
      }

      const { error: quizDeleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (quizDeleteError) throw quizDeleteError

      await fetchQuizzes()

      setStatus({
        success: true,
        msg: 'Kuis berhasil dihapus.',
      })
    } catch (error) {
      console.error('handleDeleteClick error:', error)
      setStatus({
        success: false,
        msg: error instanceof Error
          ? error.message
          : 'Gagal menghapus kuis.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateQuestions = () => {
    if (!quizTitle.trim()) {
      throw new Error('Judul kuis wajib diisi.')
    }

    if (!selectedSubjectId) {
      throw new Error('Mata pelajaran wajib dipilih.')
    }

    if (!questions.length) {
      throw new Error('Kuis minimal memiliki 1 pertanyaan.')
    }

    for (const [index, question] of questions.entries()) {
      if (!question.question.trim()) {
        throw new Error(`Pertanyaan nomor ${index + 1} wajib diisi.`)
      }

      if (question.type === 'essay') {
        if (!question.max_points || question.max_points <= 0) {
          throw new Error(
            `Poin maksimal essay nomor ${index + 1} harus lebih dari 0.`
          )
        }
      } else {
        if (
          !question.options ||
          question.options.length !== 4 ||
          question.options.some((option) => !option.trim())
        ) {
          throw new Error(
            `Semua opsi A-D pada soal nomor ${index + 1} wajib diisi.`
          )
        }

        if (!question.correct_answer?.trim()) {
          throw new Error(
            `Kunci jawaban soal nomor ${index + 1} wajib dipilih.`
          )
        }
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      validateQuestions()

      /*
       * PENTING:
       * Tabel quizzes yang kamu tunjukkan hanya memiliki:
       * id, module_id, title, questions, created_at, subject_id.
       *
       * Karena halaman ini khusus Kuis Mandiri:
       * module_id SELALU NULL.
       *
       * Jangan mengirim description / is_published karena kolom
       * tersebut tidak ada pada struktur tabel yang kamu tunjukkan.
       */
      const quizPayload = {
        title: quizTitle.trim(),
        questions,
        subject_id: selectedSubjectId,
        module_id: null,
      }

      if (editingQuizId) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizPayload)
          .eq('id', editingQuizId)

        if (error) throw error

        setStatus({
          success: true,
          msg: 'Kuis mandiri berhasil diperbarui.',
        })
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert(quizPayload)

        if (error) throw error

        setStatus({
          success: true,
          msg: 'Kuis mandiri berhasil dibuat.',
        })
      }

      await fetchQuizzes()

      setTimeout(() => {
        resetForm()
      }, 1000)
    } catch (error) {
      console.error('handleSubmit quiz error:', error)
      setStatus({
        success: false,
        msg: error instanceof Error
          ? error.message
          : 'Gagal menyimpan kuis.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuizzes = useMemo(() => {
    if (!filterSubjectId) return quizzesList

    return quizzesList.filter(
      (quiz) => quiz.subject_id === filterSubjectId
    )
  }, [filterSubjectId, quizzesList])

  const getSubjectName = (subjectId?: string | null) => {
    if (!subjectId) return 'Tanpa Mata Pelajaran'

    return (
      subjectsList.find((subject) => subject.id === subjectId)?.name ||
      'Mata Pelajaran Tidak Ditemukan'
    )
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              viewMode === 'form'
                ? resetForm()
                : router.push('/super-admin')
            }
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {viewMode === 'form'
              ? 'Kembali ke Daftar Kuis'
              : 'Kembali ke Dashboard'}
          </button>

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => {
                resetForm()
                setViewMode('form')
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat Kuis Baru
            </button>
          )}
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
            <PenLine className="w-72 h-72" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/20 text-blue-200 text-[10px] font-black uppercase tracking-wider">
              <PenLine className="w-3.5 h-3.5" />
              Manage Quiz
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {viewMode === 'form'
                ? editingQuizId
                  ? 'Edit Kuis Mandiri'
                  : 'Buat Kuis Mandiri Baru'
                : 'Manajemen Kuis Mandiri'}
            </h1>

            <p className="text-sm text-blue-100/70 max-w-2xl">
              Kuis dikelola terpisah dari materi. Semua kuis yang dibuat di
              halaman ini menggunakan tabel quizzes dengan module_id = NULL.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">
                    Filter Mapel
                  </span>
                </div>

                <select
                  value={filterSubjectId}
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  disabled={isFetchingSubjects}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Semua Mata Pelajaran</option>

                  {subjectsList.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-400">
                  {filteredQuizzes.length} kuis
                </span>
              </div>

              {status.msg && (
                <div
                  className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    status.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {status.msg}
                </div>
              )}

              {isFetching ? (
                <div className="p-12 text-center text-xs text-slate-400 flex justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
                  Memuat kuis...
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <PenLine className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-black text-slate-700">
                    Belum ada kuis mandiri
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Klik &quot;Buat Kuis Baru&quot; untuk menambahkan kuis.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuizzes.map((quiz) => {
                    const mcCount = (quiz.questions || []).filter(
                      (question) =>
                        (question.type || 'multiple_choice') ===
                        'multiple_choice'
                    ).length

                    const essayCount = (quiz.questions || []).filter(
                      (question) => question.type === 'essay'
                    ).length

                    return (
                      <motion.div
                        key={quiz.id}
                        whileHover={{ y: -3 }}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between gap-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100 truncate">
                              {getSubjectName(quiz.subject_id)}
                            </span>

                            <span className="text-[10px] font-black text-slate-400 shrink-0">
                              Kuis Mandiri
                            </span>
                          </div>

                          <h3 className="font-black text-sm text-slate-900 leading-snug">
                            {quiz.title}
                          </h3>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              {mcCount} PG
                            </span>

                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {essayCount} Essay
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400">
                            {quiz.created_at
                              ? new Date(quiz.created_at).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : '-'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(quiz)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600"
                            title="Edit Kuis"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(quiz.id)}
                            disabled={isLoading}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 disabled:opacity-50"
                            title="Hapus Kuis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {status.msg && (
                <div
                  className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    status.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {status.msg}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    Informasi Kuis
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Quiz ini berdiri sendiri dan tidak terhubung ke modules.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase">
                    Judul Kuis *
                  </label>

                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Contoh: Latihan Bahasa Inggris"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase">
                    Mata Pelajaran *
                  </label>

                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={isFetchingSubjects}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">
                      {isFetchingSubjects
                        ? 'Memuat mata pelajaran...'
                        : '-- Pilih Mata Pelajaran --'}
                    </option>

                    {subjectsList.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <p className="text-[10px] text-slate-400">
                    Yang disimpan ke quizzes.subject_id adalah UUID dari subjects.id.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-700" />
                    Daftar Soal ({questions.length})
                  </h2>

                  <button
                    type="button"
                    onClick={addQuestionField}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Soal
                  </button>
                </div>

                <div className="space-y-5">
                  {questions.map((question, questionIndex) => (
                    <motion.div
                      key={questionIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-blue-700 uppercase">
                          Soal #{questionIndex + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            value={question.type || 'multiple_choice'}
                            onChange={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                'type',
                                e.target.value
                              )
                            }
                            className="text-[11px] font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="multiple_choice">
                              Pilihan Ganda
                            </option>
                            <option value="essay">Essay</option>
                          </select>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeQuestionField(questionIndex)
                              }
                              className="p-1.5 rounded-lg bg-red-50 text-red-500"
                              title="Hapus Soal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase">
                          Pertanyaan *
                        </label>

                        <textarea
                          required
                          rows={3}
                          value={question.question}
                          onChange={(e) =>
                            handleQuestionChange(
                              questionIndex,
                              'question',
                              e.target.value
                            )
                          }
                          placeholder="Tuliskan pertanyaan..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium bg-white focus:border-blue-500 focus:outline-none resize-y"
                        />
                      </div>

                      {(question.type || 'multiple_choice') ===
                      'multiple_choice' ? (
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase">
                            Pilihan Jawaban A-D *
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(question.options || ['', '', '', '']).map(
                              (option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black shrink-0">
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>

                                  <input
                                    type="text"
                                    required
                                    value={option}
                                    onChange={(e) =>
                                      handleQuestionChange(
                                        questionIndex,
                                        'option',
                                        e.target.value,
                                        optionIndex
                                      )
                                    }
                                    placeholder={`Opsi ${String.fromCharCode(
                                      65 + optionIndex
                                    )}`}
                                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                              )
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase">
                              Kunci Jawaban *
                            </label>

                            <select
                              required
                              value={question.correct_answer || ''}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  'correct_answer',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">
                                -- Pilih Jawaban Benar --
                              </option>

                              {(question.options || []).map(
                                (option, optionIndex) =>
                                  option.trim() ? (
                                    <option
                                      key={optionIndex}
                                      value={option}
                                    >
                                      {String.fromCharCode(
                                        65 + optionIndex
                                      )}
                                      : {option}
                                    </option>
                                  ) : null
                              )}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase">
                              Poin Maksimal *
                            </label>

                            <input
                              type="number"
                              min={1}
                              max={100}
                              required
                              value={question.max_points || ''}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  'max_points',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase">
                              Pedoman / Kunci Essay
                            </label>

                            <textarea
                              rows={3}
                              value={question.answer_key || ''}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  'answer_key',
                                  e.target.value
                                )
                              }
                              placeholder="Masukkan pedoman penilaian..."
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:border-blue-500 focus:outline-none resize-y"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingQuizId ? 'Perbarui Kuis' : 'Simpan Kuis Baru'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
