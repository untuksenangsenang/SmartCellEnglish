'use client'

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import {
  BarChart3,
  Users,
  Award,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  User,
  Edit3,
  Loader2,
  AlertCircle,
  BookOpen,
  X,
  GraduationCap,
  RefreshCw,
  Target,
  ShieldCheck,
  MessageSquare,
  UserX,
  Database,
} from 'lucide-react'

const supabase = createClient()

// ============================================================
// TYPES
// ============================================================

interface UserProfile {
  id: string
  username: string
  role: string
  email?: string | null
  created_at?: string | null
}

interface QuizAttempt {
  id?: string
  user_id?: string | null
  student_id?: string | null
  module_id?: string | null
  quiz_id?: string | null
  test_id?: string | null
  score?: number | null
  total_score?: number | null
  completed_at?: string | null
  finished_at?: string | null
  created_at?: string | null
  [key: string]: unknown
}

interface EssaySubmission {
  id: string
  user_id?: string | null
  student_id?: string | null
  attempt_id?: string | null
  quiz_attempt_id?: string | null

  answer_text?: string | null
  answer?: string | null
  answers?: unknown

  score?: number | null
  feedback?: string | null
  is_corrected?: boolean | null

  question?: string | null
  question_text?: string | null

  created_at?: string | null

  quiz_attempts?: QuizAttempt | null

  profiles?: {
    username?: string | null
  } | null

  [key: string]: unknown
}

interface ScoreRow {
  id: string
  user_id: string
  module_id: string
  score: number | null
  completed_at: string | null
}

// ============================================================
// HELPERS
// ============================================================

function getUserId(row: Record<string, any>) {
  return (
    row.user_id ||
    row.student_id ||
    row.profile_id ||
    row.userId ||
    row.studentId ||
    ''
  )
}

function getScore(row: Record<string, any>) {
  const possibleScores = [
    row.score,
    row.total_score,
    row.final_score,
    row.nilai,
    row.result,
  ]

  for (const value of possibleScores) {
    if (
      typeof value === 'number' &&
      !Number.isNaN(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== '' &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value)
    }
  }

  return null
}

function getModuleName(row: Record<string, any>) {
  return (
    row.module_id ||
    row.moduleId ||
    row.quiz_id ||
    row.quizId ||
    row.test_id ||
    row.testId ||
    row.module ||
    row.quiz ||
    'Kuis'
  )
}

function getCompletedDate(row: Record<string, any>) {
  return (
    row.completed_at ||
    row.finished_at ||
    row.submitted_at ||
    row.created_at ||
    null
  )
}

function getAnswerText(row: EssaySubmission) {
  if (row.answer_text) {
    return row.answer_text
  }

  if (row.answer) {
    return row.answer
  }

  if (typeof row.answers === 'string') {
    return row.answers
  }

  if (row.answers) {
    try {
      return JSON.stringify(
        row.answers,
        null,
        2
      )
    } catch {
      return String(row.answers)
    }
  }

  return 'Tidak ada jawaban.'
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'kuis_essay' | 'users'
  >('monitoring')

  const [searchTerm, setSearchTerm] = useState('')

  // ==========================================================
  // USER STATE
  // ==========================================================

  const [users, setUsers] = useState<UserProfile[]>([])
  const [isUsersLoading, setIsUsersLoading] =
    useState(false)

  const [selectedStudentId, setSelectedStudentId] =
    useState('')

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as
      | 'user'
      | 'admin'
      | 'super_admin',
  })

  const [isCreatingUser, setIsCreatingUser] =
    useState(false)

  const [userStatus, setUserStatus] = useState<{
    success?: boolean
    msg?: string
  }>({})

  const [editingUser, setEditingUser] =
    useState<{
      id: string
      username: string
      role: string
    } | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)

  // ==========================================================
  // QUIZ STATE
  // ==========================================================

  const [essaySubmissions, setEssaySubmissions] =
    useState<EssaySubmission[]>([])

  const [scoreRows, setScoreRows] =
    useState<ScoreRow[]>([])

  const [isQuizLoading, setIsQuizLoading] =
    useState(false)

  const [selectedSubmission, setSelectedSubmission] =
    useState<EssaySubmission | null>(null)

  const [
    isCorrectionModalOpen,
    setIsCorrectionModalOpen,
  ] = useState(false)

  const [correctionScore, setCorrectionScore] =
    useState('')

  const [
    correctionFeedback,
    setCorrectionFeedback,
  ] = useState('')

  const [
    isSubmittingCorrection,
    setIsSubmittingCorrection,
  ] = useState(false)

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true)

    try {
      const response = await fetch(
        '/api/admin/get-users',
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Gagal mengambil data pengguna.'
        )
      }

      const fetchedUsers =
        Array.isArray(result.data)
          ? result.data
          : []

      setUsers(fetchedUsers)

      const students = fetchedUsers.filter(
        (user: UserProfile) =>
          user.role === 'user' ||
          user.role === 'student'
      )

      if (students.length > 0) {
        setSelectedStudentId((previous) => {
          const stillExists = students.some(
            (student: UserProfile) =>
              student.id === previous
          )

          return stillExists
            ? previous
            : students[0].id
        })
      } else {
        setSelectedStudentId('')
      }
    } catch (error) {
      console.error(
        'Error fetching users:',
        error
      )
    } finally {
      setIsUsersLoading(false)
    }
  }, [])

  // ==========================================================
  // FETCH QUIZ ATTEMPTS
  // ==========================================================

  const fetchScoreRows = useCallback(async () => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from('quiz_attempts')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        throw error
      }

      const normalized: ScoreRow[] = (
        data || []
      ).map((row: Record<string, any>) => ({
        id: String(row.id),
        user_id: getUserId(row),
        module_id: String(
          getModuleName(row)
        ),
        score: getScore(row),
        completed_at:
          getCompletedDate(row),
      }))

      setScoreRows(normalized)
    } catch (error) {
      console.error(
        'Error fetching quiz attempts:',
        error
      )

      setScoreRows([])
    }
  }, [])

  // ==========================================================
  // FETCH ESSAY ANSWERS
  //
  // IMPORTANT:
  // Tidak menggunakan:
  //
  // profiles(username)
  //
  // atau:
  //
  // quiz_attempts(...)
  //
  // karena database tidak memiliki foreign key
  // relationship yang diperlukan.
  // ==========================================================

  const fetchEssaySubmissions =
    useCallback(async () => {
      setIsQuizLoading(true)

      try {
        // ----------------------------------------------------
        // 1. Ambil quiz answers
        // ----------------------------------------------------

        const {
          data: answers,
          error: answersError,
        } = await supabase
          .from('quiz_answers')
          .select('*')
          .order('created_at', {
            ascending: false,
          })

        if (answersError) {
          throw answersError
        }

        if (!answers || answers.length === 0) {
          setEssaySubmissions([])
          return
        }

        // ----------------------------------------------------
        // 2. Ambil quiz attempts secara terpisah
        // ----------------------------------------------------

        let attempts: Record<
          string,
          any
        >[] = []

        const {
          data: attemptsData,
          error: attemptsError,
        } = await supabase
          .from('quiz_attempts')
          .select('*')

        if (!attemptsError && attemptsData) {
          attempts = attemptsData
        }

        // ----------------------------------------------------
        // 3. Ambil profiles secara terpisah
        // ----------------------------------------------------

        let profiles: Record<
          string,
          any
        >[] = []

        const {
          data: profilesData,
          error: profilesError,
        } = await supabase
          .from('profiles')
          .select('*')

        if (!profilesError && profilesData) {
          profiles = profilesData
        }

        // ----------------------------------------------------
        // 4. Gabungkan data di frontend
        // ----------------------------------------------------

        const normalized: EssaySubmission[] =
          answers.map(
            (
              answer: Record<string, any>
            ) => {
              const answerUserId =
                getUserId(answer)

              const attempt =
                attempts.find(
                  (item) => {
                    const attemptUserId =
                      getUserId(item)

                    return (
                      (
                        answer.attempt_id &&
                        item.id ===
                          answer.attempt_id
                      ) ||
                      (
                        answer.quiz_attempt_id &&
                        item.id ===
                          answer.quiz_attempt_id
                      ) ||
                      (
                        answer.quiz_attempt &&
                        item.id ===
                          answer.quiz_attempt
                      ) ||
                      (
                        answerUserId &&
                        attemptUserId &&
                        answerUserId ===
                          attemptUserId
                      )
                    )
                  }
                ) || null

              const userId =
                answerUserId ||
                (attempt
                  ? getUserId(attempt)
                  : '')

              const profile =
                profiles.find(
                  (item) =>
                    item.id === userId ||
                    item.user_id === userId ||
                    item.profile_id === userId
                ) || null

              return {
                id: String(answer.id || ''),
                ...answer,

                user_id:
                  userId || null,

                quiz_attempts:
                  attempt,

                profiles: profile
                  ? {
                      username:
                        profile.username ||
                        profile.name ||
                        profile.full_name ||
                        profile.display_name ||
                        'Siswa',
                    }
                  : {
                      username: 'Siswa',
                    },
              }
            }
          )

        setEssaySubmissions(normalized)
      } catch (error) {
        console.error(
          'Error fetching essay submissions:',
          error
        )

        setEssaySubmissions([])
      } finally {
        setIsQuizLoading(false)
      }
    }, [])

  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  const loadAllData = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchScoreRows(),
      fetchEssaySubmissions(),
    ])
  }, [
    fetchUsers,
    fetchScoreRows,
    fetchEssaySubmissions,
  ])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(() => {
    const channel = supabase
      .channel(
        'admin-dashboard-realtime'
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_answers',
        },
        () => {
          fetchEssaySubmissions()
          fetchScoreRows()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_attempts',
        },
        () => {
          fetchScoreRows()
          fetchEssaySubmissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchUsers()
          fetchEssaySubmissions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    fetchUsers,
    fetchScoreRows,
    fetchEssaySubmissions,
  ])

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const handleCreateUser = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setIsCreatingUser(true)
    setUserStatus({})

    try {
      const response = await fetch(
        '/api/admin/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username:
              newUser.username.trim(),
            email:
              newUser.email.trim(),
            password: newUser.password,
            role: newUser.role,
          }),
        }
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Gagal mendaftarkan user.'
        )
      }

      setUserStatus({
        success: true,
        msg:
          result.message ||
          'Akun berhasil dibuat.',
      })

      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user',
      })

      await fetchUsers()
    } catch (error) {
      setUserStatus({
        success: false,
        msg:
          error instanceof Error
            ? error.message
            : 'Gagal membuat user.',
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDeleteUser = async (
    id: string,
    username: string
  ) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun "${username}"?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        '/api/admin/delete-user',
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({ id }),
        }
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Gagal menghapus user.'
        )
      }

      await fetchUsers()

      if (selectedStudentId === id) {
        setSelectedStudentId('')
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus user.'
      )
    }
  }

  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const handleUpdateUser = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!editingUser) return

    try {
      const response = await fetch(
        '/api/admin/update-user',
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            editingUser
          ),
        }
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Gagal memperbarui data.'
        )
      }

      setIsEditModalOpen(false)
      setEditingUser(null)

      await fetchUsers()
      await fetchEssaySubmissions()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui data.'
      )
    }
  }

  // ==========================================================
  // OPEN ESSAY CORRECTION
  // ==========================================================

  const handleOpenCorrection = (
    submission: EssaySubmission
  ) => {
    setSelectedSubmission(
      submission
    )

    setCorrectionScore(
      submission.score !== null &&
        submission.score !== undefined
        ? String(submission.score)
        : ''
    )

    setCorrectionFeedback(
      submission.feedback || ''
    )

    setIsCorrectionModalOpen(true)
  }

  // ==========================================================
  // SAVE ESSAY CORRECTION
  // ==========================================================

  const handleSubmitCorrection =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault()

      if (!selectedSubmission) {
        return
      }

      const score =
        Number(correctionScore)

      if (
        Number.isNaN(score) ||
        score < 0 ||
        score > 100
      ) {
        window.alert(
          'Nilai harus berada antara 0 sampai 100.'
        )
        return
      }

      setIsSubmittingCorrection(
        true
      )

      try {
        const {
          error,
        } = await supabase
          .from('quiz_answers')
          .update({
            is_corrected: true,
            score,
            feedback:
              correctionFeedback.trim() ||
              null,
          })
          .eq(
            'id',
            selectedSubmission.id
          )

        if (error) {
          throw error
        }

        setIsCorrectionModalOpen(
          false
        )

        setSelectedSubmission(null)
        setCorrectionScore('')
        setCorrectionFeedback('')

        await Promise.all([
          fetchEssaySubmissions(),
          fetchScoreRows(),
        ])
      } catch (error) {
        console.error(
          'Error saving correction:',
          error
        )

        window.alert(
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan penilaian.'
        )
      } finally {
        setIsSubmittingCorrection(
          false
        )
      }
    }

  // ==========================================================
  // DERIVED USER DATA
  // ==========================================================

  const studentUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === 'user' ||
          user.role === 'student'
      ),
    [users]
  )

  const filteredUsers = useMemo(() => {
    const keyword =
      searchTerm
        .trim()
        .toLowerCase()

    if (!keyword) {
      return users
    }

    return users.filter(
      (user) =>
        user.username
          ?.toLowerCase()
          .includes(keyword) ||
        user.email
          ?.toLowerCase()
          .includes(keyword) ||
        user.role
          ?.toLowerCase()
          .includes(keyword)
    )
  }, [users, searchTerm])

  // ==========================================================
  // DERIVED ESSAY DATA
  // ==========================================================

  const filteredEssays = useMemo(() => {
    const keyword =
      searchTerm
        .trim()
        .toLowerCase()

    if (!keyword) {
      return essaySubmissions
    }

    return essaySubmissions.filter(
      (essay) => {
        const username =
          essay.profiles?.username
            ?.toLowerCase() || ''

        const moduleName =
          essay.quiz_attempts
            ? getModuleName(
                essay.quiz_attempts
              )
                .toString()
                .toLowerCase()
            : ''

        const answer =
          getAnswerText(essay)
            .toLowerCase()

        return (
          username.includes(
            keyword
          ) ||
          moduleName.includes(
            keyword
          ) ||
          answer.includes(keyword)
        )
      }
    )
  }, [
    essaySubmissions,
    searchTerm,
  ])

  const pendingEssaySubmissions =
    useMemo(
      () =>
        essaySubmissions.filter(
          (essay) =>
            essay.is_corrected !== true
        ),
      [essaySubmissions]
    )

  const correctedEssaySubmissions =
    useMemo(
      () =>
        essaySubmissions.filter(
          (essay) =>
            essay.is_corrected === true
        ),
      [essaySubmissions]
    )

  // ==========================================================
  // GLOBAL ANALYTICS
  // ==========================================================

  const totalAttempts =
    scoreRows.length

  const validScores = scoreRows
    .map((row) => row.score)
    .filter(
      (
        score
      ): score is number =>
        typeof score === 'number'
    )

  const averageScore =
    validScores.length > 0
      ? validScores.reduce(
          (sum, score) =>
            sum + score,
          0
        ) / validScores.length
      : 0

  const passedCount =
    validScores.filter(
      (score) => score >= 75
    ).length

  const passRate =
    validScores.length > 0
      ? (passedCount /
          validScores.length) *
        100
      : 0

  const highestScore =
    validScores.length > 0
      ? Math.max(...validScores)
      : 0

  // ==========================================================
  // INDIVIDUAL MONITORING
  // ==========================================================

  const currentStudent =
    studentUsers.find(
      (student) =>
        student.id ===
        selectedStudentId
    ) || null

  const selectedStudentScores =
    currentStudent
      ? scoreRows.filter(
          (row) =>
            row.user_id ===
            currentStudent.id
        )
      : []

  const selectedStudentValidScores =
    selectedStudentScores
      .map((row) => row.score)
      .filter(
        (
          score
        ): score is number =>
          typeof score === 'number'
      )

  const selectedStudentAverage =
    selectedStudentValidScores.length >
    0
      ? selectedStudentValidScores.reduce(
          (sum, score) =>
            sum + score,
          0
        ) /
        selectedStudentValidScores.length
      : 0

  const selectedStudentPassed =
    selectedStudentValidScores.filter(
      (score) => score >= 75
    ).length

  const selectedStudentPassRate =
    selectedStudentValidScores.length >
    0
      ? (selectedStudentPassed /
          selectedStudentValidScores.length) *
        100
      : 0

  // ==========================================================
  // MODULE ANALYTICS
  // ==========================================================

  const moduleAnalytics =
    useMemo(() => {
      const map = new Map<
        string,
        {
          totalScore: number
          scoreCount: number
          attempts: number
          students: Set<string>
        }
      >()

      scoreRows.forEach((row) => {
        const module =
          row.module_id ||
          'Kuis'

        if (!map.has(module)) {
          map.set(module, {
            totalScore: 0,
            scoreCount: 0,
            attempts: 0,
            students:
              new Set<string>(),
          })
        }

        const item =
          map.get(module)!

        item.attempts += 1

        if (
          typeof row.score ===
          'number'
        ) {
          item.totalScore +=
            row.score

          item.scoreCount += 1
        }

        if (row.user_id) {
          item.students.add(
            row.user_id
          )
        }
      })

      return Array.from(
        map.entries()
      )
        .map(
          ([module, value]) => ({
            module,
            average:
              value.scoreCount >
              0
                ? value.totalScore /
                  value.scoreCount
                : 0,
            attempts:
              value.attempts,
            students:
              value.students.size,
          })
        )
        .sort(
          (a, b) =>
            b.average -
            a.average
        )
    }, [scoreRows])

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-16">

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 md:p-8 text-white shadow-lg">

          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <GraduationCap className="w-64 h-64" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

            <div className="space-y-2">

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">

                <ShieldCheck className="w-3.5 h-3.5" />

                Pusat Monitoring Mentor & Administrator

              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Dashboard Pembelajaran Admin
              </h1>

              <p className="text-xs md:text-sm text-blue-100/80 max-w-2xl leading-relaxed">
                Pantau perkembangan siswa,
                analisis hasil pembelajaran,
                koreksi kuis essay, dan
                kelola registrasi pengguna
                langsung dari database.
              </p>

            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">

              <div className="text-center px-4 border-r border-white/20">

                <p className="text-2xl font-black">
                  {studentUsers.length}
                </p>

                <p className="text-[10px] text-blue-200 uppercase font-bold">
                  Siswa
                </p>

              </div>

              <div className="text-center px-4 border-r border-white/20">

                <p className="text-2xl font-black text-blue-300">
                  {totalAttempts}
                </p>

                <p className="text-[10px] text-blue-200 uppercase font-bold">
                  Percobaan
                </p>

              </div>

              <div className="text-center px-4">

                <p className="text-2xl font-black text-emerald-300">
                  {averageScore.toFixed(
                    1
                  )}
                </p>

                <p className="text-[10px] text-blue-200 uppercase font-bold">
                  Rata-rata
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-3">

          <div className="flex items-center gap-2 overflow-x-auto pb-1">

            <button
              onClick={() =>
                setActiveTab(
                  'monitoring'
                )
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab ===
                'monitoring'
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >

              <BarChart3 className="w-4 h-4" />

              Monitoring & Analitik

            </button>

            <button
              onClick={() =>
                setActiveTab(
                  'kuis_essay'
                )
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab ===
                'kuis_essay'
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >

              <Award className="w-4 h-4" />

              Koreksi Kuis Essay

              {pendingEssaySubmissions.length >
                0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full">
                  {
                    pendingEssaySubmissions.length
                  }
                </span>
              )}

            </button>

            <button
              onClick={() =>
                setActiveTab('users')
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab ===
                'users'
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >

              <UserPlus className="w-4 h-4" />

              Kelola User

            </button>

          </div>

          <div className="relative w-full lg:w-72">

            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="Cari user atau data..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />

          </div>

        </div>

        <AnimatePresence mode="wait">

          {/* ==================================================
              MONITORING
          ================================================== */}

          {activeTab ===
            'monitoring' && (
            <motion.div
              key="monitoring"
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              className="space-y-6"
            >

              {/* KPI */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-2xs">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Total Siswa
                      </p>

                      <p className="text-2xl font-black text-slate-900">
                        {
                          studentUsers.length
                        }
                      </p>

                      <p className="text-[11px] text-blue-600 font-semibold">
                        Pengguna aktif
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-2xs">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Percobaan Kuis
                      </p>

                      <p className="text-2xl font-black text-slate-900">
                        {totalAttempts}
                      </p>

                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Dari database
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-2xs">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Rata-rata Nilai
                      </p>

                      <p className="text-2xl font-black text-slate-900">
                        {averageScore.toFixed(
                          1
                        )}
                      </p>

                      <p className="text-[11px] text-amber-600 font-semibold">
                        Skala 100
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white border border-purple-100 rounded-2xl p-5 shadow-2xs">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Target className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Tingkat Kelulusan
                      </p>

                      <p className="text-2xl font-black text-slate-900">
                        {passRate.toFixed(
                          1
                        )}
                        %
                      </p>

                      <p className="text-[11px] text-purple-600 font-semibold">
                        Nilai ≥ 75
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* ANALYTICS */}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">

                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">

                    <div>

                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">

                        <BarChart3 className="w-4 h-4 text-blue-700" />

                        Analitik Nilai Per Modul

                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Statistik diambil
                        langsung dari
                        database.
                      </p>

                    </div>

                    <button
                      onClick={
                        loadAllData
                      }
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >

                      <RefreshCw className="w-3.5 h-3.5" />

                      Refresh

                    </button>

                  </div>

                  <div className="p-5 space-y-5">

                    {moduleAnalytics.length ===
                    0 ? (
                      <div className="py-12 text-center text-slate-400">

                        <Database className="w-10 h-10 mx-auto mb-3 text-slate-300" />

                        <p className="text-sm font-bold">
                          Belum ada data
                          analitik
                        </p>

                        <p className="text-xs mt-1">
                          Data akan muncul
                          setelah siswa
                          mengerjakan kuis.
                        </p>

                      </div>
                    ) : (
                      moduleAnalytics.map(
                        (module) => (
                          <div
                            key={
                              module.module
                            }
                            className="space-y-2"
                          >

                            <div className="flex items-center justify-between">

                              <div>

                                <p className="text-xs font-bold text-slate-800">
                                  {
                                    module.module
                                  }
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  {
                                    module.students
                                  }{' '}
                                  siswa ·{' '}
                                  {
                                    module.attempts
                                  }{' '}
                                  percobaan
                                </p>

                              </div>

                              <span className="text-sm font-black font-mono">
                                {module.average.toFixed(
                                  1
                                )}
                              </span>

                            </div>

                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">

                              <motion.div
                                initial={{
                                  width: 0,
                                }}
                                animate={{
                                  width: `${Math.min(
                                    module.average,
                                    100
                                  )}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                }}
                                className={`h-full rounded-full ${
                                  module.average >=
                                  75
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                              />

                            </div>

                          </div>
                        )
                      )
                    )}

                  </div>

                </div>

                {/* INDIVIDUAL */}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">

                  <div className="border-b border-slate-100 pb-3">

                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">

                      <User className="w-4 h-4 text-blue-700" />

                      Monitoring Individu

                    </h3>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Pilih siswa untuk
                      melihat performa.
                    </p>

                  </div>

                  <select
                    value={
                      selectedStudentId
                    }
                    onChange={(e) =>
                      setSelectedStudentId(
                        e.target.value
                      )
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:border-blue-600"
                  >

                    {studentUsers.length ===
                    0 ? (
                      <option value="">
                        Tidak ada siswa
                      </option>
                    ) : (
                      studentUsers.map(
                        (student) => (
                          <option
                            key={
                              student.id
                            }
                            value={
                              student.id
                            }
                          >
                            {
                              student.username
                            }
                          </option>
                        )
                      )
                    )}

                  </select>

                  {currentStudent ? (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">

                        <div className="flex items-center justify-between border-b border-blue-100 pb-3">

                          <span className="font-bold text-xs text-blue-900">
                            {
                              currentStudent.username
                            }
                          </span>

                          <span className="px-2 py-0.5 rounded bg-blue-700 text-white text-[10px] font-bold">
                            SISWA
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">

                          <div>

                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                              Percobaan
                            </p>

                            <p className="text-lg font-black">
                              {
                                selectedStudentScores.length
                              }
                            </p>

                          </div>

                          <div>

                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                              Rata-rata
                            </p>

                            <p className="text-lg font-black text-blue-700">
                              {selectedStudentAverage.toFixed(
                                1
                              )}
                            </p>

                          </div>

                          <div>

                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                              Kelulusan
                            </p>

                            <p className="text-lg font-black text-emerald-600">
                              {selectedStudentPassRate.toFixed(
                                0
                              )}
                              %
                            </p>

                          </div>

                          <div>

                            <p className="text-[10px] text-slate-400 uppercase font-bold">
                              Status
                            </p>

                            <p className="text-sm font-black mt-1">
                              {selectedStudentScores.length ===
                              0
                                ? 'Belum Ada Data'
                                : selectedStudentAverage >=
                                  75
                                ? 'Baik'
                                : 'Perlu Bimbingan'}
                            </p>

                          </div>

                        </div>

                      </div>

                      <div>

                        <div className="flex justify-between text-xs font-bold mb-2">

                          <span className="text-slate-600">
                            Indeks Performa
                          </span>

                          <span className="text-blue-700">
                            {Math.min(
                              selectedStudentAverage,
                              100
                            ).toFixed(
                              0
                            )}
                            /100
                          </span>

                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">

                          <div
                            className={`h-full rounded-full ${
                              selectedStudentAverage >=
                              75
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                selectedStudentAverage,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-slate-400">

                      <UserX className="w-8 h-8 mx-auto mb-2" />

                      <p className="text-xs font-semibold">
                        Belum ada siswa.
                      </p>

                    </div>
                  )}

                </div>

              </div>

              {/* SUMMARY */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-white rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>

                    <div>

                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Essay Belum Dikoreksi
                      </p>

                      <p className="text-xl font-black">
                        {
                          pendingEssaySubmissions.length
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>

                    <div>

                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Essay Dikoreksi
                      </p>

                      <p className="text-xl font-black">
                        {
                          correctedEssaySubmissions.length
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>

                    <div>

                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Nilai Tertinggi
                      </p>

                      <p className="text-xl font-black">
                        {highestScore.toFixed(
                          0
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* ==================================================
              KOREKSI KUIS ESSAY
          ================================================== */}

          {activeTab ===
            'kuis_essay' && (
            <motion.div
              key="essay"
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              className="space-y-5"
            >

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="bg-white border border-amber-100 rounded-2xl p-5">

                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Perlu Dikoreksi
                  </p>

                  <p className="text-3xl font-black text-amber-600 mt-1">
                    {
                      pendingEssaySubmissions.length
                    }
                  </p>

                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-5">

                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Sudah Dikoreksi
                  </p>

                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    {
                      correctedEssaySubmissions.length
                    }
                  </p>

                </div>

                <div className="bg-white border border-blue-100 rounded-2xl p-5">

                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Total Jawaban
                  </p>

                  <p className="text-3xl font-black text-blue-700 mt-1">
                    {
                      essaySubmissions.length
                    }
                  </p>

                </div>

              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">

                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">

                      <Award className="w-4 h-4 text-blue-700" />

                      Koreksi Kuis Essay

                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Nilai jawaban essay
                      siswa secara manual.
                    </p>

                  </div>

                  <button
                    onClick={
                      fetchEssaySubmissions
                    }
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >

                    <RefreshCw className="w-3.5 h-3.5" />

                    Refresh

                  </button>

                </div>

                {isQuizLoading ? (
                  <div className="p-12 flex items-center justify-center gap-2 text-xs text-slate-400">

                    <Loader2 className="w-4 h-4 animate-spin text-blue-700" />

                    Mengambil data kuis...

                  </div>
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left border-collapse text-xs">

                      <thead>

                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">

                          <th className="p-4 pl-6">
                            Siswa
                          </th>

                          <th className="p-4">
                            Modul
                          </th>

                          <th className="p-4">
                            Jawaban
                          </th>

                          <th className="p-4">
                            Tanggal
                          </th>

                          <th className="p-4 text-center">
                            Status
                          </th>

                          <th className="p-4 text-center">
                            Nilai
                          </th>

                          <th className="p-4 text-center">
                            Aksi
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {filteredEssays.length ===
                        0 ? (
                          <tr>

                            <td
                              colSpan={
                                7
                              }
                              className="p-12 text-center"
                            >

                              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />

                              <p className="text-sm font-bold text-slate-700">
                                Belum ada jawaban
                                essay.
                              </p>

                            </td>

                          </tr>
                        ) : (
                          filteredEssays.map(
                            (essay) => {

                              const attempt =
                                essay.quiz_attempts

                              return (
                                <tr
                                  key={
                                    essay.id
                                  }
                                  className="hover:bg-blue-50/30"
                                >

                                  <td className="p-4 pl-6">

                                    <div className="flex items-center gap-2">

                                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                      </div>

                                      <div>

                                        <p className="font-bold text-slate-900">
                                          {essay.profiles?.username ||
                                            'Siswa'}
                                        </p>

                                        <p className="text-[10px] text-slate-400">
                                          {essay.user_id
                                            ? essay.user_id.slice(
                                                0,
                                                8
                                              )
                                            : '-'}
                                        </p>

                                      </div>

                                    </div>

                                  </td>

                                  <td className="p-4 font-semibold text-slate-700">

                                    {attempt
                                      ? getModuleName(
                                          attempt
                                        )
                                      : 'Kuis'}

                                  </td>

                                  <td className="p-4 max-w-xs">

                                    <p className="line-clamp-2 text-slate-600 whitespace-pre-wrap">
                                      {getAnswerText(
                                        essay
                                      )}
                                    </p>

                                  </td>

                                  <td className="p-4 text-slate-400">

                                    {essay.created_at
                                      ? new Date(
                                          essay.created_at
                                        ).toLocaleDateString(
                                          'id-ID'
                                        )
                                      : '-'}

                                  </td>

                                  <td className="p-4 text-center">

                                    {essay.is_corrected ===
                                    true ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">

                                        <CheckCircle2 className="w-3 h-3" />

                                        Dikoreksi

                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">

                                        <Clock className="w-3 h-3" />

                                        Belum

                                      </span>
                                    )}

                                  </td>

                                  <td className="p-4 text-center font-black font-mono">

                                    {essay.score ??
                                      '-'}

                                  </td>

                                  <td className="p-4 text-center">

                                    <button
                                      onClick={() =>
                                        handleOpenCorrection(
                                          essay
                                        )
                                      }
                                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white font-bold transition-colors inline-flex items-center gap-1"
                                    >

                                      <Edit3 className="w-3.5 h-3.5" />

                                      Nilai

                                    </button>

                                  </td>

                                </tr>
                              )
                            }
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

              {/* ESSAY MODAL */}

              <AnimatePresence>

                {isCorrectionModalOpen &&
                  selectedSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">

                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                        }}
                        className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-5"
                      >

                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                          <div>

                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">

                              <Edit3 className="w-5 h-5 text-blue-700" />

                              Koreksi Jawaban Essay

                            </h3>

                            <p className="text-xs text-slate-500 mt-1">

                              {
                                selectedSubmission
                                  .profiles
                                  ?.username ||
                                'Siswa'
                              }

                            </p>

                          </div>

                          <button
                            onClick={() =>
                              setIsCorrectionModalOpen(
                                false
                              )
                            }
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                          >

                            <X className="w-5 h-5" />

                          </button>

                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                          <div className="flex items-center gap-2 mb-3">

                            <MessageSquare className="w-4 h-4 text-blue-700" />

                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Jawaban Siswa
                            </p>

                          </div>

                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {getAnswerText(
                              selectedSubmission
                            )}
                          </p>

                        </div>

                        <form
                          onSubmit={
                            handleSubmitCorrection
                          }
                          className="space-y-4"
                        >

                          <div className="space-y-1">

                            <label className="text-xs font-bold text-slate-700">
                              Skor
                            </label>

                            <input
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={
                                correctionScore
                              }
                              onChange={(e) =>
                                setCorrectionScore(
                                  e.target
                                    .value
                                )
                              }
                              placeholder="0 - 100"
                              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-sm font-bold"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-xs font-bold text-slate-700">
                              Feedback Mentor
                            </label>

                            <textarea
                              rows={5}
                              value={
                                correctionFeedback
                              }
                              onChange={(e) =>
                                setCorrectionFeedback(
                                  e.target
                                    .value
                                )
                              }
                              placeholder="Tuliskan feedback untuk siswa..."
                              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-sm resize-none"
                            />

                          </div>

                          <div className="flex justify-end gap-2 pt-2">

                            <button
                              type="button"
                              onClick={() =>
                                setIsCorrectionModalOpen(
                                  false
                                )
                              }
                              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Batal
                            </button>

                            <button
                              type="submit"
                              disabled={
                                isSubmittingCorrection
                              }
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-2 disabled:opacity-50"
                            >

                              {isSubmittingCorrection && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}

                              Simpan Penilaian

                            </button>

                          </div>

                        </form>

                      </motion.div>

                    </div>
                  )}

              </AnimatePresence>

            </motion.div>
          )}

          {/* ==================================================
              USER MANAGEMENT
          ================================================== */}

          {activeTab ===
            'users' && (
            <motion.div
              key="users"
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              className="space-y-6"
            >

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* REGISTRATION */}

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">

                  <div className="border-b border-slate-100 pb-4 mb-5">

                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">

                      <UserPlus className="w-4 h-4 text-blue-700" />

                      Registrasi Akun

                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Tambahkan pengguna baru
                      ke database.
                    </p>

                  </div>

                  {userStatus.msg && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 mb-4 ${
                        userStatus.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >

                      {userStatus.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}

                      {userStatus.msg}

                    </div>
                  )}

                  <form
                    onSubmit={
                      handleCreateUser
                    }
                    className="space-y-4"
                  >

                    <div className="space-y-1">

                      <label className="text-xs font-bold text-slate-700">
                        Username / Nama
                      </label>

                      <input
                        type="text"
                        required
                        value={
                          newUser.username
                        }
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            username:
                              e.target
                                .value,
                          })
                        }
                        placeholder="Nama lengkap siswa"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                      />

                    </div>

                    <div className="space-y-1">

                      <label className="text-xs font-bold text-slate-700">
                        Email
                      </label>

                      <input
                        type="email"
                        required
                        value={
                          newUser.email
                        }
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            email: e.target
                              .value,
                          })
                        }
                        placeholder="email@example.com"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                      />

                    </div>

                    <div className="space-y-1">

                      <label className="text-xs font-bold text-slate-700">
                        Password
                      </label>

                      <input
                        type="password"
                        required
                        minLength={6}
                        value={
                          newUser.password
                        }
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            password:
                              e.target
                                .value,
                          })
                        }
                        placeholder="Minimal 6 karakter"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                      />

                    </div>

                    <div className="space-y-1">

                      <label className="text-xs font-bold text-slate-700">
                        Role
                      </label>

                      <select
                        value={
                          newUser.role
                        }
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            role: e.target
                              .value as
                              | 'user'
                              | 'admin'
                              | 'super_admin',
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-xs font-bold"
                      >

                        <option value="user">
                          Anak Binaan
                        </option>

                        <option value="admin">
                          Mentor / Admin
                        </option>

                        <option value="super_admin">
                          Super Admin
                        </option>

                      </select>

                    </div>

                    <button
                      type="submit"
                      disabled={
                        isCreatingUser
                      }
                      className="w-full py-3 rounded-xl bg-blue-700 text-white hover:bg-blue-800 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >

                      {isCreatingUser && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}

                      Daftarkan Akun

                    </button>

                  </form>

                </div>

                {/* USER TABLE */}

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">

                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">

                    <div>

                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">

                        <Users className="w-4 h-4 text-blue-700" />

                        Pengguna Terdaftar

                        <span className="text-slate-400">
                          (
                          {
                            filteredUsers.length
                          }
                          )
                        </span>

                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Data pengguna dari
                        database.
                      </p>

                    </div>

                    <button
                      onClick={
                        fetchUsers
                      }
                      className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                    >

                      <RefreshCw className="w-3.5 h-3.5" />

                      Refresh

                    </button>

                  </div>

                  {isUsersLoading ? (
                    <div className="p-12 flex justify-center items-center gap-2 text-xs text-slate-400">

                      <Loader2 className="w-4 h-4 animate-spin text-blue-700" />

                      Memuat data pengguna...

                    </div>
                  ) : filteredUsers.length ===
                    0 ? (
                    <div className="p-12 text-center text-slate-400">

                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />

                      <p className="text-sm font-bold">
                        Tidak ada pengguna.
                      </p>

                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full text-left border-collapse text-xs">

                        <thead>

                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">

                            <th className="p-4 pl-5">
                              Pengguna
                            </th>

                            <th className="p-4">
                              Email
                            </th>

                            <th className="p-4">
                              Role
                            </th>

                            <th className="p-4 text-center">
                              Aksi
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {filteredUsers.map(
                            (user) => (
                              <tr
                                key={
                                  user.id
                                }
                                className="hover:bg-blue-50/30"
                              >

                                <td className="p-4 pl-5">

                                  <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                      <User className="w-4 h-4" />
                                    </div>

                                    <div>

                                      <p className="font-bold text-slate-900">
                                        {
                                          user.username
                                        }
                                      </p>

                                      <p className="text-[10px] text-slate-400">
                                        ID:{' '}
                                        {user.id.slice(
                                          0,
                                          8
                                        )}
                                      </p>

                                    </div>

                                  </div>

                                </td>

                                <td className="p-4 text-slate-500">
                                  {user.email ||
                                    '-'}
                                </td>

                                <td className="p-4">

                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                      user.role ===
                                      'super_admin'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : user.role ===
                                          'admin'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {user.role ===
                                    'super_admin'
                                      ? 'Super Admin'
                                      : user.role ===
                                        'admin'
                                      ? 'Admin'
                                      : 'Siswa'}
                                  </span>

                                </td>

                                <td className="p-4 text-center">

                                  <div className="flex justify-center gap-2">

                                    <button
                                      onClick={() => {
                                        setEditingUser(
                                          {
                                            id: user.id,
                                            username:
                                              user.username,
                                            role: user.role,
                                          }
                                        )

                                        setIsEditModalOpen(
                                          true
                                        )
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-700 hover:text-white text-slate-600 font-bold transition-colors"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDeleteUser(
                                          user.id,
                                          user.username
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-100 transition-colors"
                                    >
                                      Hapus
                                    </button>

                                  </div>

                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

              </div>

              {/* EDIT USER MODAL */}

              <AnimatePresence>

                {isEditModalOpen &&
                  editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">

                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.95,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.95,
                        }}
                        className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl"
                      >

                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">

                          <div>

                            <h3 className="font-bold text-sm text-slate-900">
                              Edit Pengguna
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                              Perbarui data dan
                              hak akses.
                            </p>

                          </div>

                          <button
                            onClick={() => {
                              setIsEditModalOpen(
                                false
                              )
                              setEditingUser(
                                null
                              )
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                          >

                            <X className="w-4 h-4" />

                          </button>

                        </div>

                        <form
                          onSubmit={
                            handleUpdateUser
                          }
                          className="space-y-4"
                        >

                          <div className="space-y-1">

                            <label className="text-xs font-bold text-slate-700">
                              Username
                            </label>

                            <input
                              type="text"
                              required
                              value={
                                editingUser.username
                              }
                              onChange={(e) =>
                                setEditingUser(
                                  {
                                    ...editingUser,
                                    username:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                            />

                          </div>

                          <div className="space-y-1">

                            <label className="text-xs font-bold text-slate-700">
                              Role
                            </label>

                            <select
                              value={
                                editingUser.role
                              }
                              onChange={(e) =>
                                setEditingUser(
                                  {
                                    ...editingUser,
                                    role: e.target
                                      .value,
                                  }
                                )
                              }
                              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-xs font-bold"
                            >

                              <option value="user">
                                Anak Binaan
                              </option>

                              <option value="admin">
                                Mentor / Admin
                              </option>

                              <option value="super_admin">
                                Super Admin
                              </option>

                            </select>

                          </div>

                          <div className="flex justify-end gap-2 pt-2">

                            <button
                              type="button"
                              onClick={() => {
                                setIsEditModalOpen(
                                  false
                                )
                                setEditingUser(
                                  null
                                )
                              }}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Batal
                            </button>

                            <button
                              type="submit"
                              className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
                            >
                              Simpan Data
                            </button>

                          </div>

                        </form>

                      </motion.div>

                    </div>
                  )}

              </AnimatePresence>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  )
}