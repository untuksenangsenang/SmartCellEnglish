'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, Variants } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  PenLine,
  Loader2,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  FileText,
  Award,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface QuizQuestion {
  type?: string
  question?: string
  options?: string[]
  correct_answer?: string
  max_points?: number
}

interface QuizItem {
  id: string
  module_id?: string | null
  title: string
  questions: QuizQuestion[] | null
  created_at?: string | null
  subject_id?: string | null
}

interface AttemptItem {
  id: string
  quiz_id: string
  score: number | null
}

interface SubjectData {
  id: string
  name: string
}

// ============================================================
// ANIMATION
// ============================================================

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },

  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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
}

// ============================================================
// CARD THEMES
// ============================================================

const CARD_THEMES = [
  {
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    soft: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-100',
    glow: 'group-hover:shadow-violet-200/60',
    dot: 'bg-violet-500',
  },

  {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    glow: 'group-hover:shadow-emerald-200/60',
    dot: 'bg-emerald-500',
  },

  {
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
    glow: 'group-hover:shadow-amber-200/60',
    dot: 'bg-amber-500',
  },

  {
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-100',
    glow: 'group-hover:shadow-sky-200/60',
    dot: 'bg-sky-500',
  },

  {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    soft: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-100',
    glow: 'group-hover:shadow-pink-200/60',
    dot: 'bg-pink-500',
  },
]

// ============================================================
// COMPONENT
// ============================================================

export default function StudentQuizzesPage() {
  const router = useRouter()
  const supabase = createClient()

  // ==========================================================
  // STATE
  // ==========================================================

  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // ==========================================================
  // FETCH DATA
  // ==========================================================

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    try {
      // ------------------------------------------------------
      // GET CURRENT USER
      // ------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setUserId(null)
        setQuizzes([])
        setAttempts([])
        setSubjects([])
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      // ------------------------------------------------------
      // FETCH STANDALONE QUIZZES
      //
      // Kolom yang digunakan:
      // id
      // module_id
      // title
      // questions
      // created_at
      // subject_id
      //
      // Tidak menggunakan:
      // description
      // is_published
      // ------------------------------------------------------

      const {
        data: quizzesData,
        error: qError,
      } = await supabase
        .from('quizzes')
        .select(`
          id,
          module_id,
          title,
          questions,
          created_at,
          subject_id
        `)
        .is('module_id', null)
        .order('created_at', {
          ascending: false,
        })

      if (qError) {
        throw qError
      }

      const normalizedQuizzes: QuizItem[] = (
        quizzesData || []
      ).map((quiz) => ({
        id: quiz.id,
        module_id: quiz.module_id ?? null,
        title: quiz.title || 'Kuis Tanpa Judul',
        questions: Array.isArray(quiz.questions)
          ? quiz.questions
          : [],
        created_at: quiz.created_at ?? null,
        subject_id: quiz.subject_id ?? null,
      }))

      setQuizzes(normalizedQuizzes)

      // ------------------------------------------------------
      // FETCH USER ATTEMPTS
      //
      // PENTING:
      // Hanya menggunakan kolom yang memang dipakai ketika
      // quiz_attempts dibuat:
      //
      // id
      // quiz_id
      // score
      //
      // Tidak menggunakan:
      // status
      // total_score
      // mc_score
      // essay_score
      // submitted_at
      // ------------------------------------------------------

      if (normalizedQuizzes.length > 0) {
        const quizIds = normalizedQuizzes.map(
          (quiz) => quiz.id
        )

        const {
          data: attemptsData,
          error: attemptsError,
        } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            quiz_id,
            score
          `)
          .eq('user_id', user.id)
          .in('quiz_id', quizIds)

        if (attemptsError) {
          console.warn(
            'Failed to load quiz attempts:',
            attemptsError
          )

          setAttempts([])
        } else {
          setAttempts(
            (attemptsData || []).map((attempt) => ({
              id: attempt.id,
              quiz_id: attempt.quiz_id,
              score:
                typeof attempt.score === 'number'
                  ? attempt.score
                  : attempt.score !== null &&
                    attempt.score !== undefined
                    ? Number(attempt.score)
                    : null,
            }))
          )
        }
      } else {
        setAttempts([])
      }

      // ------------------------------------------------------
      // FETCH SUBJECTS
      // ------------------------------------------------------

      const {
        data: subjectsData,
        error: subjectsError,
      } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name', {
          ascending: true,
        })

      if (subjectsError) {
        console.warn(
          'Failed to load subjects:',
          subjectsError
        )

        setSubjects([])
      } else {
        setSubjects(
          (subjectsData || []).map((subject) => ({
            id: subject.id,
            name: subject.name,
          }))
        )
      }
    } catch (err) {
      console.error(
        'Failed to load quizzes:',
        err
      )

      setQuizzes([])
      setAttempts([])
      setSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ==========================================================
  // GET ATTEMPT FOR QUIZ
  // ==========================================================

  const getAttemptForQuiz = (
    quizId: string
  ): AttemptItem | null => {
    return (
      attempts.find(
        (attempt) => attempt.quiz_id === quizId
      ) || null
    )
  }

  // ==========================================================
  // STATUS BADGE
  //
  // Tidak lagi menggunakan attempt.status karena kolom status
  // tidak digunakan di struktur quiz_attempts saat ini.
  // ==========================================================

  const getStatusBadge = (
    attempt: AttemptItem | null
  ) => {
    if (!attempt) {
      return null
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Sudah Dikerjakan
      </span>
    )
  }

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 flex items-center justify-center px-6">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-purple-200 blur-xl opacity-50" />

            <div className="relative w-16 h-16 rounded-2xl bg-white border border-purple-100 shadow-xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-800">
              Memuat daftar kuis
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Mohon tunggu sebentar...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/40 text-slate-800 selection:bg-purple-500 selection:text-white">

      {/* ======================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-200/20 blur-3xl" />

        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-200/15 blur-3xl" />
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">

        {/* ====================================================
            BACK BUTTON
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-6"
        >
          <button
            type="button"
            onClick={() => router.push('/user')}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-purple-600 transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>

            Kembali ke Dashboard
          </button>
        </motion.div>

        {/* ====================================================
            HERO
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg mb-8"
        >
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <GraduationCap className="w-72 h-72" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />

              Kuis Evaluasi Mandiri
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Kuis & Evaluasi 📝
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Kerjakan kuis evaluasi dari mentor
              untuk mengukur pemahaman belajar Anda.
              Pilihan ganda akan langsung dinilai
              berdasarkan jawaban yang tersedia.
            </p>
          </div>
        </motion.div>

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {quizzes.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3"
          >
            <PenLine className="w-10 h-10 mx-auto text-slate-300" />

            <p className="text-sm font-bold text-slate-700">
              Belum ada kuis tersedia
            </p>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Belum ada kuis evaluasi mandiri
              yang tersedia.
              Periksa kembali nanti!
            </p>

            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
            >
              <Loader2 className="w-3.5 h-3.5" />

              Muat Ulang
            </button>
          </motion.div>
        ) : (

          /* ==================================================
             QUIZ CARDS
          ================================================== */

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {quizzes.map((quiz, idx) => {
              const theme =
                CARD_THEMES[
                  idx % CARD_THEMES.length
                ]

              const attempt =
                getAttemptForQuiz(quiz.id)

              const hasAttempted =
                !!attempt

              // ------------------------------------------------
              // NORMALIZE QUESTIONS
              // ------------------------------------------------

              const questions =
                Array.isArray(quiz.questions)
                  ? quiz.questions
                  : []

              // ------------------------------------------------
              // COUNT MULTIPLE CHOICE
              // ------------------------------------------------

              const mcCount =
                questions.filter(
                  (question) =>
                    (
                      question.type ||
                      'multiple_choice'
                    ) === 'multiple_choice'
                ).length

              // ------------------------------------------------
              // COUNT ESSAY
              // ------------------------------------------------

              const essayCount =
                questions.filter(
                  (question) =>
                    question.type === 'essay'
                ).length

              // ------------------------------------------------
              // FIND SUBJECT
              // ------------------------------------------------

              const subjectName =
                subjects.find(
                  (subject) =>
                    subject.id ===
                    quiz.subject_id
                )?.name || null

              return (
                <motion.div
                  key={quiz.id}
                  variants={itemVariants}
                  className={`group relative bg-white rounded-2xl border ${theme.border} overflow-hidden shadow-sm hover:shadow-xl ${theme.glow} transition-all duration-300`}
                >

                  {/* ==========================================
                      GRADIENT HEADER
                  ========================================== */}

                  <div
                    className={`h-2 bg-gradient-to-r ${theme.gradient}`}
                  />

                  <div className="p-5 flex flex-col gap-4 h-full">

                    <div className="space-y-3 flex-1">

                      {/* ========================================
                          SUBJECT + STATUS
                      ======================================== */}

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          {subjectName ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${theme.soft} ${theme.text} border ${theme.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}
                              />

                              {subjectName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border border-slate-200">
                              Tanpa Mata Pelajaran
                            </span>
                          )}
                        </div>

                        {getStatusBadge(
                          attempt
                        )}
                      </div>

                      {/* ========================================
                          TITLE
                      ======================================== */}

                      <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-purple-700 transition-colors">
                        {quiz.title}
                      </h3>

                      {/* ========================================
                          QUESTION INFO
                      ======================================== */}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />

                          {mcCount} PG
                        </span>

                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />

                          {essayCount} Essay
                        </span>

                        <span className="flex items-center gap-1">
                          <PenLine className="w-3 h-3" />

                          {questions.length} Soal
                        </span>
                      </div>

                      {/* ========================================
                          SCORE DISPLAY
                      ======================================== */}

                      {hasAttempted && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">
                              Skor:
                            </span>

                            <span className="font-black text-slate-900 font-mono text-sm">
                              {attempt?.score ?? '-'}
                            </span>
                          </div>

                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />

                            Percobaan sudah tersimpan
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ==========================================
                        ACTION
                    ========================================== */}

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/user/quizzes/${quiz.id}`
                          )
                        }
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          hasAttempted
                            ? 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                        }`}
                      >
                        {hasAttempted ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />

                            Lihat Detail / Ulangi
                          </>
                        ) : (
                          <>
                            Mulai Kerjakan

                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </main>
  )
}