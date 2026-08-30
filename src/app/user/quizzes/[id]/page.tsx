'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ArrowLeft,
  Headphones,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  Loader2,
  BookOpen,
  HelpCircle,
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  PenLine,
  Clock3,
  CircleHelp,
  Trophy,
  Target,
  MessageSquareText,
  ListChecks,
} from 'lucide-react'

interface Question {
  question: string
  options?: string[]
  correct_answer?: string
  type?: string
  question_type?: string
  answer_type?: string
  [key: string]: any
}

interface ModuleData {
  id: string
  title: string
  content_text?: string | null
  file_url?: string | null
  audio_url?: string | null
  created_at?: string
  [key: string]: any
}

interface QuizData {
  id: string
  module_id: string
  title?: string
  questions: Question[]
  [key: string]: any
}

type ActiveTab = 'materi' | 'kuis'

const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

const questionVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 18,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -18,
    transition: {
      duration: 0.2,
    },
  },
}

function isEssayQuestion(question: Question) {
  const type = String(
    question.type ||
      question.question_type ||
      question.answer_type ||
      ''
  ).toLowerCase()

  if (
    type.includes('essay') ||
    type.includes('text') ||
    type.includes('short') ||
    type.includes('long') ||
    type.includes('subjective')
  ) {
    return true
  }

  return !Array.isArray(question.options) || question.options.length === 0
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizAvailable, setQuizAvailable] = useState(false)
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<ActiveTab>('materi')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const fetchModule = async () => {
      setIsLoading(true)
      setQuizData(null)
      setQuizId(null)
      setQuizAvailable(false)
      setActiveTab('materi')
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setQuizSubmitted(false)
      setScore(0)

      try {
        // ============================================================
        // 1. MODUL ADALAH DATA UTAMA HALAMAN
        // ============================================================
        // Satu halaman selalu mewakili satu module ID, sehingga .single()
        // memang tepat digunakan untuk tabel modules.
        const { data: moduleRes, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', id)
          .single()

        if (moduleError) {
          throw moduleError
        }

        if (cancelled) return
        setModuleData(moduleRes)

        // ============================================================
        // 2. JANGAN FETCH QUIZ SAAT MEMBUKA DETAIL MODUL
        // ============================================================
        // Halaman ini hanya bertanggung jawab menampilkan module.
        // Quiz baru diambil ketika user menekan tombol Kuis Evaluasi.
        // Dengan begitu modul yang tidak mempunyai quiz tidak pernah
        // melakukan request ke tabel quizzes dan tidak akan menghasilkan 406.
        setQuizAvailable(true)
        setQuizId(null)
      } catch (error) {
        if (cancelled) return
        console.error('[ModuleDetail] Gagal mengambil modul:', error)
        setModuleData(null)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchModule()

    return () => {
      cancelled = true
    }
  }, [id, supabase])

  // ============================================================
  // LOAD QUIZ SAAT USER BENAR-BENAR MEMBUKA TAB KUIS
  // ============================================================
  const loadQuiz = async () => {
    if (!id) return

    // Quiz hanya dicari ketika user benar-benar menekan tombol quiz.
    // Tidak ada request ke quizzes pada saat halaman modul pertama kali dibuka.
    if (quizData?.id && quizData.module_id === id) {
      setActiveTab('kuis')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsQuizLoading(true)
    setActiveTab('kuis')

    try {
      // Gunakan ARRAY + limit(1), bukan single/maybeSingle.
      // Jika modul tidak mempunyai quiz, hasilnya [] dan kita bisa menanganinya
      // sebagai kondisi normal tanpa 406.
      const { data: quizRows, error: quizError } = await supabase
        .from('quizzes')
        .select('id,module_id,title,questions')
        .eq('module_id', id)
        .limit(1)

      if (quizError) {
        throw quizError
      }

      const quiz = quizRows?.[0] ?? null

      if (!quiz) {
        setQuizData(null)
        setQuizAvailable(false)
        setQuizId(null)
        setActiveTab('materi')
        throw new Error('Quiz untuk modul ini belum tersedia.')
      }

      setQuizId(quiz.id)
      setQuizAvailable(true)
      setQuizData(quiz)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('[ModuleDetail] Gagal memuat quiz:', error)
      alert(
        `Quiz belum dapat dibuka. ${
          error instanceof Error ? error.message : 'Silakan coba lagi.'
        }`
      )
    } finally {
      setIsQuizLoading(false)
    }
  }

  const questions: Question[] = useMemo(() => {
    if (!quizData?.questions) return []

    if (Array.isArray(quizData.questions)) {
      return quizData.questions
    }

    if (typeof quizData.questions === 'string') {
      try {
        const parsed = JSON.parse(quizData.questions)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    return []
  }, [quizData])

  const totalQuestions = questions.length

  const answeredCount = useMemo(() => {
    return Object.values(userAnswers).filter(
      answer => answer.trim().length > 0
    ).length
  }, [userAnswers])

  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0

  const currentQuestion = questions[currentQuestionIndex]

  const handleSelectOption = (
    questionIndex: number,
    selectedOption: string
  ) => {
    if (quizSubmitted) return

    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption,
    }))
  }

  const handleEssayAnswer = (
    questionIndex: number,
    answer: string
  ) => {
    if (quizSubmitted) return

    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const isQuestionAnswered = (index: number) => {
    return Boolean(userAnswers[index]?.trim())
  }

  const calculateScore = () => {
    if (!questions.length) return 0

    let correctCount = 0
    let gradableQuestions = 0

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index] || ''

      if (!userAnswer.trim()) return

      const isEssay = isEssayQuestion(question)

      if (isEssay) {
        /*
         * Essay:
         * Jika correct_answer tersedia, lakukan pencocokan sederhana.
         * Jika tidak tersedia, soal essay tidak dipaksakan menjadi benar/salah.
         */
        if (question.correct_answer) {
          gradableQuestions++

          if (
            normalizeAnswer(userAnswer) ===
            normalizeAnswer(String(question.correct_answer))
          ) {
            correctCount++
          }
        }
      } else {
        gradableQuestions++

        if (
          normalizeAnswer(userAnswer) ===
          normalizeAnswer(String(question.correct_answer || ''))
        ) {
          correctCount++
        }
      }
    })

    /*
     * Jika ada essay tanpa correct_answer, jangan membuat score menjadi
     * 0 hanya karena essay perlu dinilai manual.
     *
     * Nilai dihitung berdasarkan soal yang memang dapat dikoreksi otomatis.
     */
    if (gradableQuestions === 0) return 0

    return Math.round((correctCount / gradableQuestions) * 100)
  }

  const handleSubmitQuiz = async () => {
    if (!quizData || !questions.length) return

    if (answeredCount < totalQuestions) return

    setIsSubmitting(true)

    const finalScore = calculateScore()
    setScore(finalScore)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error(
          'Sesi pengguna tidak ditemukan. Silakan login kembali.'
        )
      }

      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizData.id,
          score: finalScore,
        })

      if (error) {
        throw error
      }

      setQuizSubmitted(true)
    } catch (error: any) {
      console.error('Gagal mencatat nilai kuis:', error)

      alert(
        'Nilai berhasil dihitung, tetapi gagal direkam ke server: ' +
          error.message
      )

      setQuizSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const resetQuiz = () => {
    setQuizSubmitted(false)
    setUserAnswers({})
    setCurrentQuestionIndex(0)
    setScore(0)
  }

  const switchTab = (tab: ActiveTab) => {
    if (tab === 'kuis') {
      loadQuiz()
      return
    }

    setActiveTab(tab)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald-200 blur-xl opacity-50" />

            <div className="relative w-16 h-16 rounded-2xl bg-white border border-emerald-100 shadow-xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-800">
              Memuat modul pembelajaran
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Mohon tunggu sebentar...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
            <CircleHelp className="w-7 h-7 text-red-500" />
          </div>

          <h2 className="text-xl font-black text-slate-900">
            Modul tidak ditemukan
          </h2>

          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Materi pembelajaran tidak ditemukan atau mungkin telah dihapus.
          </p>

          <button
            onClick={() => router.push('/user/modules')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Modul
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-teal-200/15 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
        {/* Top navigation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/user/modules')}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>

            Kembali ke Modul
          </button>
        </motion.div>

        {/* Premium module hero */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-200/70 mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/10" />

          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-emerald-300 text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Modul Pembelajaran
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {moduleData.title}
                </h1>

                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Pelajari materi dengan nyaman, dengarkan pelafalan bila
                  tersedia, lalu uji pemahamanmu melalui kuis interaktif.
                </p>
              </div>

              {quizAvailable && (
                <div className="shrink-0 flex items-center gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <ListChecks className="w-4 h-4" />
                      <span className="text-xs font-bold">
                        {totalQuestions > 0 ? `${totalQuestions} Soal` : 'Quiz tersedia'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="sticky top-2 z-20 mb-6"
        >
          <div className="p-1.5 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/30">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => switchTab('materi')}
                className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'materi'
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Materi Pembelajaran
              </button>

              {quizAvailable && (
                <button
                  onClick={loadQuiz}
                  disabled={isQuizLoading}
                  className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'kuis'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Kuis Evaluasi

                  {quizSubmitted && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* =====================================================
              MATERI
          ====================================================== */}
          {activeTab === 'materi' && (
            <motion.section
              key="materi"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

                <div className="p-5 sm:p-8">
                  <div className="flex items-start gap-4 mb-7">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      {moduleData.file_url ? (
                        <FileText className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                        Materi
                      </p>

                      <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950">
                        {moduleData.title}
                      </h2>
                    </div>
                  </div>

                  {/* Audio */}
                  {moduleData.audio_url && (
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                            <Headphones className="w-4 h-4" />
                          </div>

                          <div>
                            <p className="text-xs font-black text-emerald-950">
                              Audio Pelafalan
                            </p>
                            <p className="text-[11px] text-emerald-700/70">
                              Dengarkan dan ikuti pengucapannya
                            </p>
                          </div>
                        </div>

                        <audio
                          src={moduleData.audio_url}
                          controls
                          className="w-full h-9"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF */}
                  {moduleData.file_url ? (
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 h-[500px] sm:h-[650px] shadow-inner">
                        <iframe
                          src={`${moduleData.file_url}#toolbar=1`}
                          className="w-full h-full border-0"
                          title={`Dokumen: ${moduleData.title}`}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-400">
                          Gunakan pinch-to-zoom pada perangkat mobile untuk
                          memperbesar dokumen.
                        </p>

                        <div className="flex items-center gap-2">
                          <a
                            href={moduleData.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Buka Tab Baru
                          </a>

                          <a
                            href={moduleData.file_url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <article className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5 sm:p-7">
                      <div className="flex items-center gap-2 mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <FileText className="w-4 h-4" />
                        Isi Materi
                      </div>

                      <div className="text-slate-700 leading-8 whitespace-pre-line text-[15px] sm:text-base">
                        {moduleData.content_text || (
                          <span className="text-slate-400 italic">
                            Belum ada isi materi.
                          </span>
                        )}
                      </div>
                    </article>
                  )}

                  {/* CTA */}
                  {quizAvailable && (
                    <div className="mt-8 pt-7 border-t border-slate-100">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 p-5 sm:p-6 text-white">
                        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl" />

                        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                          <div>
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                              <Sparkles className="w-3.5 h-3.5" />
                              Siap menguji pemahaman?
                            </div>

                            <h3 className="mt-1 text-lg font-black">
                              Mulai Kuis Evaluasi
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                              Quiz tersedia untuk modul ini. Soal akan dimuat saat kamu membukanya.
                            </p>
                          </div>

                          <button
                            onClick={loadQuiz}
                            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-black shadow-lg shadow-emerald-900/30 transition-all group"
                          >
                            Mulai Kuis
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {/* =====================================================
              KUIS
          ====================================================== */}
          {activeTab === 'kuis' && isQuizLoading && !quizData && (
            <motion.section
              key="kuis-loading"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 p-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
                <h2 className="mt-4 text-lg font-black text-slate-900">Memuat Kuis</h2>
                <p className="mt-1 text-sm text-slate-500">Menyiapkan soal untuk modul ini...</p>
              </div>
            </motion.section>
          )}

          {activeTab === 'kuis' && quizData && (
            <motion.section
              key="kuis"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {!quizSubmitted ? (
                <div className="space-y-5">
                  {/* Quiz header */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                          <Target className="w-4 h-4" />
                          Kuis Evaluasi
                        </div>

                        <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950">
                          Uji Pemahamanmu
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Clock3 className="w-4 h-4" />
                        {answeredCount}/{totalQuestions} terjawab
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Progress Kuis
                        </span>

                        <span className="text-xs font-black text-emerald-600">
                          {progressPercentage}%
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{
                            type: 'spring',
                            stiffness: 100,
                            damping: 20,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question navigator */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/20 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Navigasi Soal
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {questions.map((question, index) => {
                        const active = currentQuestionIndex === index
                        const answered = isQuestionAnswered(index)
                        const essay = isEssayQuestion(question)

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`relative shrink-0 w-10 h-10 rounded-xl text-xs font-black transition-all ${
                              active
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : answered
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {index + 1}

                            {essay && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Current question */}
                  <AnimatePresence mode="wait">
                    {currentQuestion && (
                      <motion.div
                        key={currentQuestionIndex}
                        variants={questionVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden"
                      >
                        <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

                        <div className="p-5 sm:p-8">
                          {/* Question label */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black">
                                Soal {currentQuestionIndex + 1}
                                <span className="text-emerald-300">/</span>
                                {totalQuestions}
                              </span>

                              {isEssayQuestion(currentQuestion) ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold">
                                  <PenLine className="w-3 h-3" />
                                  Essay
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold">
                                  <ListChecks className="w-3 h-3" />
                                  Pilihan Ganda
                                </span>
                              )}
                            </div>

                            {isQuestionAnswered(currentQuestionIndex) && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Terjawab
                              </span>
                            )}
                          </div>

                          {/* Question */}
                          <div className="mb-7">
                            <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-relaxed">
                              {currentQuestion.question}
                            </h3>
                          </div>

                          {/* ===============================
                              ESSAY ANSWER
                          ================================ */}
                          {isEssayQuestion(currentQuestion) ? (
                            <div className="space-y-3">
                              <label
                                htmlFor={`essay-${currentQuestionIndex}`}
                                className="flex items-center gap-2 text-sm font-bold text-slate-700"
                              >
                                <MessageSquareText className="w-4 h-4 text-violet-500" />
                                Tulis jawabanmu
                              </label>

                              <textarea
                                id={`essay-${currentQuestionIndex}`}
                                value={
                                  userAnswers[currentQuestionIndex] || ''
                                }
                                onChange={e =>
                                  handleEssayAnswer(
                                    currentQuestionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder="Ketik jawabanmu di sini..."
                                rows={7}
                                disabled={quizSubmitted}
                                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                              />

                              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                <span>
                                  Pastikan jawaban sudah lengkap sebelum
                                  melanjutkan.
                                </span>

                                <span className="shrink-0 font-semibold">
                                  {
                                    (userAnswers[currentQuestionIndex] || '')
                                      .length
                                  }{' '}
                                  karakter
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* ===============================
                               MULTIPLE CHOICE
                            ================================ */
                            <div className="grid gap-3">
                              {(currentQuestion.options || []).map(
                                (option, optionIndex) => {
                                  const isSelected =
                                    userAnswers[currentQuestionIndex] ===
                                    option

                                  const letter = String.fromCharCode(
                                    65 + optionIndex
                                  )

                                  return (
                                    <button
                                      key={optionIndex}
                                      type="button"
                                      onClick={() =>
                                        handleSelectOption(
                                          currentQuestionIndex,
                                          option
                                        )
                                      }
                                      className={`w-full text-left rounded-2xl border p-4 transition-all group ${
                                        isSelected
                                          ? 'border-emerald-500 bg-emerald-50/70 ring-4 ring-emerald-500/10'
                                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border transition-all ${
                                            isSelected
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200'
                                          }`}
                                        >
                                          {letter}
                                        </span>

                                        <span
                                          className={`flex-1 text-sm sm:text-base leading-relaxed ${
                                            isSelected
                                              ? 'font-bold text-emerald-950'
                                              : 'font-medium text-slate-700'
                                          }`}
                                        >
                                          {option}
                                        </span>

                                        {isSelected && (
                                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  )
                                }
                              )}
                            </div>
                          )}

                          {/* Navigation */}
                          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              disabled={currentQuestionIndex === 0}
                              onClick={handlePreviousQuestion}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                Sebelumnya
                              </span>
                            </button>

                            {currentQuestionIndex <
                            totalQuestions - 1 ? (
                              <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black transition-all shadow-md group"
                              >
                                Berikutnya
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                disabled={
                                  answeredCount < totalQuestions ||
                                  isSubmitting
                                }
                                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-200 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                  </>
                                ) : (
                                  <>
                                    Kirim Jawaban
                                    <Sparkles className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {answeredCount < totalQuestions && (
                            <p className="text-center text-[11px] text-slate-400 mt-4">
                              Jawab semua soal terlebih dahulu untuk mengirim
                              kuis.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* =====================================================
                   HASIL KUIS
                ====================================================== */
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-300/50"
                  >
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />

                    <div className="relative p-7 sm:p-10 text-center">
                      <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                        <Trophy className="w-4 h-4" />
                        Hasil Evaluasi
                      </div>

                      <div className="mt-5">
                        <div className="text-6xl sm:text-7xl font-black tracking-tight">
                          {score}
                          <span className="text-xl sm:text-2xl text-slate-500 font-bold">
                            {' '}
                            / 100
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 max-w-xl mx-auto text-sm text-slate-300 leading-relaxed">
                        {score >= 75
                          ? 'Luar biasa! Kamu telah memahami materi dengan sangat baik. Pertahankan hasil belajarmu! 🎉'
                          : 'Tetap semangat! Baca kembali materi dengan teliti dan coba kerjakan kuis sekali lagi. 💪'}
                      </p>

                      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => switchTab('materi')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all"
                        >
                          <BookOpen className="w-4 h-4" />
                          Baca Materi Lagi
                        </button>

                        <button
                          onClick={resetQuiz}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-950/30 transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Review */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div className="p-5 sm:p-7 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div>
                          <h3 className="font-black text-slate-950">
                            Review Jawaban
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Lihat kembali jawabanmu setelah menyelesaikan
                            kuis.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 space-y-4">
                      {questions.map((question, questionIndex) => {
                        const essay = isEssayQuestion(question)
                        const answer = userAnswers[questionIndex] || ''

                        const isCorrect =
                          !essay &&
                          normalizeAnswer(answer) ===
                            normalizeAnswer(
                              String(question.correct_answer || '')
                            )

                        const essayHasKey =
                          essay && Boolean(question.correct_answer)

                        const essayCorrect =
                          essayHasKey &&
                          normalizeAnswer(answer) ===
                            normalizeAnswer(
                              String(question.correct_answer || '')
                            )

                        return (
                          <motion.div
                            key={questionIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: questionIndex * 0.04,
                            }}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                {questionIndex + 1}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {essay
                                      ? 'Essay'
                                      : 'Pilihan Ganda'}
                                  </span>

                                  {essay ? (
                                    essayHasKey ? (
                                      essayCorrect ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Cocok
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                                          <XCircle className="w-3 h-3" />
                                          Tidak cocok
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600">
                                        <PenLine className="w-3 h-3" />
                                        Perlu evaluasi
                                      </span>
                                    )
                                  ) : isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Benar
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                                      <XCircle className="w-3 h-3" />
                                      Salah
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                                  {question.question}
                                </p>

                                <div className="mt-4">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                    Jawaban Kamu
                                  </p>

                                  <div
                                    className={`rounded-xl p-3 text-sm leading-relaxed ${
                                      isCorrect || essayCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                                        : essay && !essayHasKey
                                          ? 'bg-violet-50 text-violet-900 border border-violet-100'
                                          : 'bg-red-50 text-red-900 border border-red-100'
                                    }`}
                                  >
                                    {answer || (
                                      <span className="italic opacity-60">
                                        Tidak dijawab
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {!isCorrect &&
                                  !essay &&
                                  question.correct_answer && (
                                    <div className="mt-3">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">
                                        Jawaban Benar
                                      </p>

                                      <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 text-sm text-emerald-900 font-semibold">
                                        {question.correct_answer}
                                      </div>
                                    </div>
                                  )}

                                {essay && !essayHasKey && (
                                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-violet-50 border border-violet-100">
                                    <PenLine className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />

                                    <p className="text-xs text-violet-800 leading-relaxed">
                                      Jawaban essay tersimpan. Soal ini tidak
                                      memiliki{' '}
                                      <strong>correct_answer</strong>, sehingga
                                      tidak dikoreksi otomatis.
                                    </p>
                                  </div>
                                )}

                                {essay && essayHasKey && !essayCorrect && (
                                  <div className="mt-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">
                                      Referensi Jawaban
                                    </p>

                                    <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 text-sm text-emerald-900 font-semibold">
                                      {question.correct_answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}