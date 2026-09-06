'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
  PenLine,
  Clock3,
  CircleHelp,
  Trophy,
  Target,
  MessageSquareText,
  ListChecks,
  GraduationCap,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface Question {
  question: string
  options?: string[]
  correct_answer?: string
  answer_key?: string
  type?: 'multiple_choice' | 'essay' | string
  question_type?: string
  answer_type?: string
  max_points?: number
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
  title: string
  questions: Question[]
  subject_id?: string | null
  module_id?: string | null
  created_at?: string | null
  [key: string]: any
}

interface SubjectData {
  id: string
  name: string
}

type ActiveTab = 'kuis' | 'materi'

// ============================================================
// ANIMATION VARIANTS
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

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
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getCorrectAnswer(question: Question): string {
  return question.correct_answer || question.answer_key || ''
}

// ============================================================
// COMPONENT
// ============================================================

export default function StudentQuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  // State Data
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null)
  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [existingScore, setExistingScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // State Quiz
  const [activeTab, setActiveTab] = useState<ActiveTab>('kuis')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============================================================
  // FETCH QUIZ & ASSOCIATED DATA
  // ============================================================
  const fetchQuizDetail = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    setQuizData(null)
    setSubjectData(null)
    setModuleData(null)
    setExistingScore(null)
    setUserAnswers({})
    setQuizSubmitted(false)
    setScore(0)
    setCurrentQuestionIndex(0)

    try {
      // 1. Fetch Quiz by ID
      const { data: quizRes, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (quizError) {
        throw quizError
      }

      if (!quizRes) {
        console.warn('[QuizDetail] Kuis tidak ditemukan dengan ID:', id)
        setQuizData(null)
        return
      }

      // Parse questions if necessary
      let parsedQuestions: Question[] = []
      if (Array.isArray(quizRes.questions)) {
        parsedQuestions = quizRes.questions
      } else if (typeof quizRes.questions === 'string') {
        try {
          const parsed = JSON.parse(quizRes.questions)
          parsedQuestions = Array.isArray(parsed) ? parsed : []
        } catch {
          parsedQuestions = []
        }
      }

      const normalizedQuiz: QuizData = {
        ...quizRes,
        questions: parsedQuestions,
      }
      setQuizData(normalizedQuiz)

      // 2. Fetch Subject if subject_id is present
      if (quizRes.subject_id) {
        const { data: subjRes } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('id', quizRes.subject_id)
          .maybeSingle()

        if (subjRes) {
          setSubjectData(subjRes)
        }
      }

      // 3. Fetch Module if module_id is present
      if (quizRes.module_id) {
        const { data: modRes } = await supabase
          .from('modules')
          .select('*')
          .eq('id', quizRes.module_id)
          .maybeSingle()

        if (modRes) {
          setModuleData(modRes)
        }
      }

      // 4. Fetch Previous Attempt for current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: attemptRes } = await supabase
          .from('quiz_attempts')
          .select('id, quiz_id, score')
          .eq('user_id', user.id)
          .eq('quiz_id', id)
          .order('id', { ascending: false })
          .limit(1)

        if (attemptRes && attemptRes.length > 0) {
          const prevScore =
            typeof attemptRes[0].score === 'number'
              ? attemptRes[0].score
              : attemptRes[0].score !== null && attemptRes[0].score !== undefined
                ? Number(attemptRes[0].score)
                : null
          setExistingScore(prevScore)
        }
      }
    } catch (error) {
      console.error('[QuizDetail] Gagal mengambil data kuis:', error)
      setQuizData(null)
    } finally {
      setIsLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    fetchQuizDetail()
  }, [fetchQuizDetail])

  // Questions Normalized
  const questions: Question[] = useMemo(() => {
    return quizData?.questions || []
  }, [quizData])

  const totalQuestions = questions.length

  const answeredCount = useMemo(() => {
    return Object.values(userAnswers).filter(
      answer => answer && answer.trim().length > 0
    ).length
  }, [userAnswers])

  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0

  const currentQuestion = questions[currentQuestionIndex]

  const handleSelectOption = (questionIndex: number, selectedOption: string) => {
    if (quizSubmitted) return
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption,
    }))
  }

  const handleEssayAnswer = (questionIndex: number, answer: string) => {
    if (quizSubmitted) return
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const isQuestionAnswered = (index: number) => {
    return Boolean(userAnswers[index]?.trim())
  }

  // ============================================================
  // CALCULATE SCORE
  // ============================================================
  const calculateScore = () => {
    if (!questions.length) return 0

    let correctCount = 0
    let gradableQuestions = 0

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index] || ''
      if (!userAnswer.trim()) return

      const isEssay = isEssayQuestion(question)
      const correctAns = getCorrectAnswer(question)

      if (isEssay) {
        if (correctAns) {
          gradableQuestions++
          if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAns)) {
            correctCount++
          }
        }
      } else {
        gradableQuestions++
        if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAns)) {
          correctCount++
        }
      }
    })

    if (gradableQuestions === 0) return 0
    return Math.round((correctCount / gradableQuestions) * 100)
  }

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================
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
        throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')
      }

      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quizData.id,
        score: finalScore,
      })

      if (error) {
        throw error
      }

      setQuizSubmitted(true)
      setExistingScore(finalScore)
    } catch (error: any) {
      console.error('[QuizDetail] Gagal mencatat nilai kuis:', error)
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

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-purple-200 blur-xl opacity-50" />
            <div className="relative w-16 h-16 rounded-2xl bg-white border border-purple-100 shadow-xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800">Memuat lembar kuis</p>
            <p className="text-sm text-slate-400 mt-1">
              Mohon tunggu sebentar...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ============================================================
  // 404 / NOT FOUND STATE
  // ============================================================
  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
            <CircleHelp className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Kuis Tidak Ditemukan
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Kuis evaluasi yang Anda cari tidak tersedia atau mungkin telah dihapus.
          </p>
          <button
            onClick={() => router.push('/user/quizzes')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Kuis
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN VIEW
  // ============================================================
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 text-slate-800 selection:bg-purple-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-200/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-200/15 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
        {/* Top navigation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            onClick={() => router.push('/user/quizzes')}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>
            Kembali ke Daftar Kuis
          </button>

          {existingScore !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Skor Terakhir: {existingScore}
            </div>
          )}
        </motion.div>

        {/* Hero header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-purple-950/20 mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-indigo-600/10" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-purple-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Kuis Evaluasi Mandiri
                  </div>

                  {subjectData && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {subjectData.name}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {quizData.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Jawab pertanyaan pilihan ganda dan essay berikut dengan cermat
                  untuk mengukur pemahaman materi belajar Anda.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-purple-300">
                    <ListChecks className="w-4 h-4" />
                    <span className="text-xs font-bold">
                      {totalQuestions} Pertanyaan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Optional Tabs if Module is connected */}
        {moduleData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-2 z-20 mb-6"
          >
            <div className="p-1.5 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/30">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('kuis')}
                  className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'kuis'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Kuis Evaluasi
                  {quizSubmitted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('materi')}
                  className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'materi'
                      ? 'bg-slate-950 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Materi Terkait
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* =====================================================
              TAB MATERI (IF CONNECTED MODULE EXISTS)
          ====================================================== */}
          {activeTab === 'materi' && moduleData && (
            <motion.section
              key="materi"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400" />

                <div className="p-5 sm:p-8">
                  <div className="flex items-start gap-4 mb-7">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      {moduleData.file_url ? (
                        <FileText className="w-5 h-5 text-purple-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
                        Materi Referensi
                      </p>
                      <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950">
                        {moduleData.title}
                      </h2>
                    </div>
                  </div>

                  {/* Audio */}
                  {moduleData.audio_url && (
                    <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
                            <Headphones className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-purple-950">
                              Audio Pelafalan
                            </p>
                            <p className="text-[11px] text-purple-700/70">
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

                  {/* PDF Document */}
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
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 transition-all"
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
                            Belum ada isi teks materi.
                          </span>
                        )}
                      </div>
                    </article>
                  )}

                  {/* Back to Quiz CTA */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('kuis')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition-all cursor-pointer"
                    >
                      Kembali ke Kuis
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* =====================================================
              TAB KUIS
          ====================================================== */}
          {activeTab === 'kuis' && (
            <motion.section
              key="kuis"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {totalQuestions === 0 ? (
                <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                  <PenLine className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-base font-bold text-slate-800">
                    Belum ada pertanyaan pada kuis ini
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Mentor belum menambahkan pertanyaan ke dalam kuis ini. Silakan
                    periksa kembali nanti.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/user/quizzes')}
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali ke Daftar Kuis
                  </button>
                </div>
              ) : !quizSubmitted ? (
                <div className="space-y-5">
                  {/* Quiz Header Info & Progress */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-purple-600 text-xs font-black uppercase tracking-widest">
                          <Target className="w-4 h-4" />
                          Lembar Evaluasi
                        </div>
                        <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-950">
                          {quizData.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <Clock3 className="w-4 h-4 text-purple-600" />
                        <span>
                          {answeredCount} dari {totalQuestions} terjawab
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Progress Pengerjaan
                        </span>
                        <span className="text-xs font-black text-purple-600">
                          {progressPercentage}%
                        </span>
                      </div>

                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
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

                  {/* Question Navigator */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/20 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                          Navigasi Soal
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                          Aktif
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Terjawab
                        </span>
                      </div>
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
                            className={`relative shrink-0 w-10 h-10 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              active
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200 ring-2 ring-purple-600/30'
                                : answered
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {index + 1}
                            {essay && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-white" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Active Question Box */}
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
                        <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400" />

                        <div className="p-5 sm:p-8">
                          {/* Question Label */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-black">
                                Pertanyaan {currentQuestionIndex + 1} / {totalQuestions}
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
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Sudah Dijawab
                              </span>
                            )}
                          </div>

                          {/* Question Text */}
                          <div className="mb-7">
                            <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-relaxed">
                              {currentQuestion.question}
                            </h3>
                          </div>

                          {/* Answers Area */}
                          {isEssayQuestion(currentQuestion) ? (
                            /* ESSAY ANSWER */
                            <div className="space-y-3">
                              <label
                                htmlFor={`essay-${currentQuestionIndex}`}
                                className="flex items-center gap-2 text-sm font-bold text-slate-700"
                              >
                                <MessageSquareText className="w-4 h-4 text-purple-600" />
                                Jawaban Anda
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
                                placeholder="Ketik jawaban lengkap Anda di sini..."
                                rows={6}
                                disabled={quizSubmitted}
                                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                              />

                              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                <span>
                                  Pastikan kalimat jawaban telah jelas dan lengkap.
                                </span>
                                <span className="shrink-0 font-semibold font-mono">
                                  {
                                    (userAnswers[currentQuestionIndex] || '')
                                      .length
                                  }{' '}
                                  karakter
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* MULTIPLE CHOICE ANSWERS */
                            <div className="grid gap-3">
                              {(currentQuestion.options || []).map(
                                (option, optionIndex) => {
                                  const isSelected =
                                    userAnswers[currentQuestionIndex] === option

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
                                      className={`w-full text-left rounded-2xl border p-4 transition-all group cursor-pointer ${
                                        isSelected
                                          ? 'border-purple-500 bg-purple-50/70 ring-4 ring-purple-500/10'
                                          : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border transition-all ${
                                            isSelected
                                              ? 'bg-purple-600 text-white border-purple-600'
                                              : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-200'
                                          }`}
                                        >
                                          {letter}
                                        </span>

                                        <span
                                          className={`flex-1 text-sm sm:text-base leading-relaxed ${
                                            isSelected
                                              ? 'font-bold text-purple-950'
                                              : 'font-medium text-slate-700'
                                          }`}
                                        >
                                          {option}
                                        </span>

                                        {isSelected && (
                                          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  )
                                }
                              )}
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              disabled={currentQuestionIndex === 0}
                              onClick={handlePreviousQuestion}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                Sebelumnya
                              </span>
                            </button>

                            {currentQuestionIndex < totalQuestions - 1 ? (
                              <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-purple-600 text-white text-xs sm:text-sm font-black transition-all shadow-md group cursor-pointer"
                              >
                                Berikutnya
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                disabled={
                                  answeredCount < totalQuestions || isSubmitting
                                }
                                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-200 transition-all disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
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
                              Jawab semua ({totalQuestions - answeredCount} soal
                              lagi) untuk mengirim kuis.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* =====================================================
                   HASIL EVALUASI & REVIEW JAWABAN
                ====================================================== */
                <div className="space-y-6">
                  {/* Score Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-purple-950/30"
                  >
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />

                    <div className="relative p-7 sm:p-10 text-center">
                      <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest">
                        <Trophy className="w-4 h-4" />
                        Hasil Evaluasi Kuis
                      </div>

                      <div className="mt-5">
                        <div className="text-6xl sm:text-7xl font-black tracking-tight text-white">
                          {score}
                          <span className="text-xl sm:text-2xl text-slate-400 font-bold">
                            {' '}
                            / 100
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 max-w-xl mx-auto text-sm text-slate-300 leading-relaxed">
                        {score >= 75
                          ? 'Luar biasa! Kamu telah menguasai materi ini dengan sangat baik. Pertahankan prestasimu! 🎉'
                          : score >= 50
                            ? 'Bagus! Namun masih ada beberapa bagian yang bisa ditingkatkan lagi. Tetap semangat! 💪'
                            : 'Jangan berkecil hati! Pelajari kembali materinya dan coba kerjakan kuis sekali lagi. 📚'}
                      </p>

                      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.push('/user/quizzes')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Daftar Kuis
                        </button>

                        <button
                          type="button"
                          onClick={resetQuiz}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-950/30 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Review Jawaban */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div className="p-5 sm:p-7 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-950">
                            Review Jawaban
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Periksa hasil jawaban Anda untuk setiap pertanyaan.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 space-y-4">
                      {questions.map((question, questionIndex) => {
                        const essay = isEssayQuestion(question)
                        const answer = userAnswers[questionIndex] || ''
                        const correctAns = getCorrectAnswer(question)

                        const isCorrect =
                          !essay &&
                          normalizeAnswer(answer) === normalizeAnswer(correctAns)

                        const essayHasKey = essay && Boolean(correctAns)
                        const essayCorrect =
                          essayHasKey &&
                          normalizeAnswer(answer) === normalizeAnswer(correctAns)

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
                              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                                {questionIndex + 1}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {essay ? 'Essay' : 'Pilihan Ganda'}
                                  </span>

                                  {essay ? (
                                    essayHasKey ? (
                                      essayCorrect ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Sesuai Kunci
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          <PenLine className="w-3 h-3" />
                                          Perlu Review Mentor
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                        <PenLine className="w-3 h-3" />
                                        Tersimpan
                                      </span>
                                    )
                                  ) : isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Benar
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
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
                                    Jawaban Anda
                                  </p>
                                  <div
                                    className={`rounded-xl p-3 text-sm leading-relaxed ${
                                      isCorrect || essayCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                        : essay && !essayHasKey
                                          ? 'bg-purple-50 text-purple-900 border border-purple-200'
                                          : 'bg-red-50 text-red-900 border border-red-200'
                                    }`}
                                  >
                                    {answer || (
                                      <span className="italic opacity-60">
                                        Tidak dijawab
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {!isCorrect && !essay && correctAns && (
                                  <div className="mt-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5">
                                      Kunci Jawaban Benar
                                    </p>
                                    <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 font-semibold">
                                      {correctAns}
                                    </div>
                                  </div>
                                )}

                                {essay && correctAns && (
                                  <div className="mt-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1.5">
                                      Referensi / Kunci Jawaban
                                    </p>
                                    <div className="rounded-xl p-3 bg-purple-50 border border-purple-200 text-sm text-purple-900 font-medium">
                                      {correctAns}
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