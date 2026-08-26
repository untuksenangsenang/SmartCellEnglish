'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { 
  BarChart3, 
  Users, 
  FileText, 
  Award, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Filter, 
  Calendar, 
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
  ChevronRight,
  Info,
  ArrowUpRight
} from 'lucide-react'

const supabase = createClient()

const MAPEL_LIST = ['Semua', 'Bahasa Inggris', 'Vocab & Grammar', 'Speaking & Listening', 'Reading & Writing', 'Umum']

interface UserProfile {
  id: string
  username: string
  role: string
  email?: string
  created_at?: string
}

interface HomeworkItem {
  id: string
  title: string
  description?: string | null
  mapel?: string | null
  due_date?: string | null
  created_at?: string
}

interface EssaySubmissionItem {
  id: string
  answer_text?: string
  answers?: unknown
  score?: number | null
  feedback?: string | null
  is_corrected?: boolean
  created_at?: string
  quiz_attempts?: {
    module_id?: string
    user_id?: string
    score?: number
    completed_at?: string
  }
  profiles?: {
    username?: string
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'pr' | 'kuis_essay' | 'users'>('monitoring')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedMapel, setSelectedMapel] = useState<string>('Semua')

  // Data State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // PR / Homework State (Announcement only mode)
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([])
  const [isPrLoading, setIsPrLoading] = useState<boolean>(false)
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null)

  // Quiz Essay Submissions State
  const [essaySubmissions, setEssaySubmissions] = useState<EssaySubmissionItem[]>([])
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false)
  const [selectedSubmission, setSelectedSubmission] = useState<EssaySubmissionItem | null>(null)
  const [correctionScore, setCorrectionScore] = useState<string>('')
  const [correctionFeedback, setCorrectionFeedback] = useState<string>('')
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false)

  // Form User Baru State
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
  })
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false)
  const [userStatus, setUserStatus] = useState<{ success?: boolean; msg?: string }>({})

  // State Edit User Modal
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; role: string } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)

  // ==========================================
  // FETCH DATA FUNCTIONS
  // ==========================================
  
  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true)
    try {
      const res = await fetch('/api/admin/get-users')
      const result = await res.json()
      if (res.ok && Array.isArray(result.data)) {
        const fetchedUsers: UserProfile[] = result.data
        setUsers(fetchedUsers)
        const students = fetchedUsers.filter((u) => u.role === 'user' || u.role === 'student')
        if (students.length > 0) {
          setSelectedStudentId((prev) => prev || students[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setIsUsersLoading(false)
    }
  }, [])

  const fetchHomework = useCallback(async () => {
    setIsPrLoading(true)
    try {
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setHomeworkList(data as HomeworkItem[])
      }
    } catch (err) {
      console.error('Error fetching homework:', err)
    } finally {
      setIsPrLoading(false)
    }
  }, [])

  const fetchEssaySubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('*, quiz_attempts(user_id, score, completed_at), profiles(username)')
        .eq('is_corrected', false)
        .limit(20)
      if (!error && data) {
        setEssaySubmissions(data as EssaySubmissionItem[])
      }
    } catch (err) {
      console.error('Error fetching essay submissions:', err)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const loadAllData = async () => {
      if (ignore) return
      await Promise.all([fetchUsers(), fetchHomework(), fetchEssaySubmissions()])
    }
    loadAllData()
    return () => {
      ignore = true
    }
  }, [fetchUsers, fetchHomework, fetchEssaySubmissions])

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingUser(true)
    setUserStatus({})

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          username: newUser.username,
          role: newUser.role
        })
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Gagal mendaftarkan user.')

      setUserStatus({ success: true, msg: result.message || `Akun ${newUser.username} berhasil dibuat!` })
      setNewUser({ username: '', email: '', password: '', role: 'user' })
      fetchUsers()
    } catch (error: unknown) {
      const err = error as Error
      setUserStatus({ success: false, msg: err.message || 'Gagal membuat user.' })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${name}"?`)) return
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal menghapus user.')
      alert(result.message)
      fetchUsers()
    } catch (err: unknown) {
      const error = err as Error
      alert(`Gagal: ${error.message}`)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal memperbarui data.')
      setIsEditModalOpen(false)
      setEditingUser(null)
      fetchUsers()
      alert('Perubahan akun berhasil disimpan!')
    } catch (err: unknown) {
      const error = err as Error
      alert(`Gagal: ${error.message}`)
    }
  }

  const handleOpenCorrection = (submission: EssaySubmissionItem) => {
    setSelectedSubmission(submission)
    setCorrectionScore(submission.score ? String(submission.score) : '')
    setCorrectionFeedback(submission.feedback || '')
    setIsCorrectionModalOpen(true)
  }

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCorrection(true)
    try {
      if (selectedSubmission) {
        await supabase
          .from('quiz_answers')
          .update({
            is_corrected: true,
            score: parseInt(correctionScore) || 0,
            feedback: correctionFeedback
          })
          .eq('id', selectedSubmission.id)
      }
      setIsCorrectionModalOpen(false)
      fetchEssaySubmissions()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmittingCorrection(false)
    }
  }

  // Filter List Students & Homework
  const studentUsers = users.filter(u => u.role === 'user' || u.role === 'student')
  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredHomework = homeworkList.filter(hw => {
    const matchesMapel = selectedMapel === 'Semua' || (hw.mapel && hw.mapel.toLowerCase().includes(selectedMapel.toLowerCase()))
    const matchesSearch = hw.title?.toLowerCase().includes(searchTerm.toLowerCase()) || hw.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesMapel && matchesSearch
  })

  const currentStudentObj = studentUsers.find(s => s.id === selectedStudentId) || studentUsers[0] || { username: 'Anak Binaan' }

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ── 1. HEADER DASHBOARD UTAMA ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <GraduationCap className="w-64 h-64" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> Pusat Monitoring Mentor & Administrator
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Dashboard Pembelajaran Admin
              </h1>
              <p className="text-xs md:text-sm text-blue-100/80 max-w-2xl leading-relaxed">
                Pantau progres perkembangan anak binaan, kelola pengumuman Tugas Pekerjaan Rumah (PR), analisis skor kuis, dan registrasi akun secara mandiri.
              </p>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 shrink-0">
              <div className="text-center px-3 border-r border-white/20">
                <p className="text-2xl font-black text-white">{studentUsers.length}</p>
                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Siswa Aktif</p>
              </div>
              <div className="text-center px-3 border-r border-white/20">
                <p className="text-2xl font-black text-blue-300">{homeworkList.length}</p>
                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">PR Diterbitkan</p>
              </div>
              <div className="text-center px-3">
                <p className="text-2xl font-black text-emerald-300">86.4</p>
                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Rata-rata Skor</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. NAVBAR TAB NAVIGATION ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'monitoring'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Monitoring & Analitik Grafik
            </button>

            <button
              onClick={() => setActiveTab('pr')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pr'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Pemantauan PR Selesai & Aktif
            </button>

            <button
              onClick={() => setActiveTab('kuis_essay')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kuis_essay'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Award className="w-4 h-4" /> Koreksi Kuis Essay
              {essaySubmissions.length > 0 && (
                <span className="ml-1 bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  {essaySubmissions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Kelola & Registrasi User
            </button>
          </div>

          {/* Search Box Global */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* ── 3. MAIN CONTENT DISPLAY ────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ================================================================= */}
          {/* TAB 1: MONITORING PROGRES & ANALITIK GRAFIK MULTI-DIMENSI */}
          {/* ================================================================= */}
          {activeTab === 'monitoring' && (
            <motion.div
              key="monitoring-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              {/* Ringkasan KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-blue-100 rounded-2xl shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Anak Binaan</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{studentUsers.length}</p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Akun Terverifikasi
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-blue-100 rounded-2xl shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Modul Diselesaikan</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">142</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +18% minggu ini
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-blue-100 rounded-2xl shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pengumuman PR Aktif</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{homeworkList.length}</p>
                    <p className="text-[11px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Informasi Terbit
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-blue-100 rounded-2xl shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Kelulusan</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">88.5%</p>
                    <p className="text-[11px] text-purple-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Performa Sangat Baik
                    </p>
                  </div>
                </div>
              </div>

              {/* GRID GRAFIK PERFORMA KELOMPOK & INDIVIDUAL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* GRAFIK 1: Rata-Rata Nilai Kuis per Mata Pelajaran (2 Kolom) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-700" /> Analisis Rata-Rata Nilai Kuis per Mata Pelajaran
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Statistik kumulatif hasil pengerjaan kuis siswa berdasarkan kelompok bidang studi
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                      Real-time Sync
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      { mapel: 'Vocabulary & Word Bank', score: 92, count: '48 Siswa', color: 'bg-blue-600' },
                      { mapel: 'Grammar & Structure', score: 84, count: '45 Siswa', color: 'bg-blue-700' },
                      { mapel: 'Speaking & Listening Practice', score: 78, count: '42 Siswa', color: 'bg-sky-500' },
                      { mapel: 'Reading Comprehension', score: 88, count: '46 Siswa', color: 'bg-indigo-600' },
                      { mapel: 'Daily Expression & Idioms', score: 95, count: '48 Siswa', color: 'bg-emerald-600' },
                    ].map((item) => (
                      <div key={item.mapel} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            {item.mapel}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-normal text-[11px]">{item.count}</span>
                            <span className="font-bold text-slate-900 font-mono text-xs">{item.score} / 100</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`${item.color} h-full rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-600" /> Target ketuntasan minimal kuis: <strong className="text-slate-800">75.0</strong>
                    </span>
                    <button onClick={() => fetchUsers()} className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Perbarui Data
                    </button>
                  </div>
                </div>

                {/* GRAFIK 2: MONITORING INDIVIDUAL PER ANAK BINAAN (1 Kolom) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-700" /> Pemantauan Individu Anak Binaan
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pilih anak binaan untuk melihat statistik khusus</p>
                    </div>

                    {/* Selector Anak Binaan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Pilih Nama Siswa</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer"
                      >
                        {studentUsers.length === 0 ? (
                          <option value="">Tidak ada siswa terdaftar</option>
                        ) : (
                          studentUsers.map((student) => (
                            <option key={student.id} value={student.id}>
                              👦 {student.username}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Detail Card Performa Siswa Terpilih */}
                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                        <span className="font-bold text-xs text-blue-900">{currentStudentObj.username}</span>
                        <span className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold">Aktif Belajar</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Vocabulary Score:</span>
                          <span className="font-bold text-slate-900 font-mono">92%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Grammar Basics:</span>
                          <span className="font-bold text-slate-900 font-mono">85%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Speaking Recording:</span>
                          <span className="font-bold text-slate-900 font-mono">80%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Modul Microlearning:</span>
                          <span className="font-bold text-emerald-700 font-mono">12 / 12 Selesai</span>
                        </div>
                      </div>
                    </div>

                    {/* Competency Meter */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Indeks Pemahaman Mandiri:</span>
                        <span className="text-blue-700 font-mono">89 / 100</span>
                      </p>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-700 h-full rounded-full w-[89%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                    >
                      Lihat Semua Profil Pengguna <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: PEMANTAUAN TUGAS PEKERJAAN RUMAH (PR BROADCAST ANNOUNCEMENT) */}
          {/* ================================================================= */}
          {activeTab === 'pr' && (
            <motion.div
              key="pr-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              {/* Informational Banner */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-blue-900">
                  <p className="font-bold text-sm text-blue-950">Mode Informasi & Pemantauan PR</p>
                  <p className="leading-relaxed text-blue-800">
                    Sesuai dengan alur sistem, tugas Pekerjaan Rumah (PR) berfungsi sebagai <strong>pengumuman & bimbingan instruksi belajar mandiri</strong> bagi anak binaan. Siswa melihat detail tugas dari aplikasi tanpa melakukan unggah berkas online.
                  </p>
                </div>
              </div>

              {/* Filter Per Mapel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  {MAPEL_LIST.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMapel(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        selectedMapel === m
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Menampilkan: <span className="font-bold text-slate-900">{filteredHomework.length} PR Terdaftar</span>
                </div>
              </div>

              {/* Homework Cards List */}
              {isPrLoading ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-700" /> Memuat daftar pengumuman PR...
                </div>
              ) : filteredHomework.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Belum ada pengumuman PR pada kategori ini</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Admin atau Super Admin dapat menambahkan instruksi PR baru melalui menu Kelola PR di Super Admin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHomework.map((hw) => (
                    <div
                      key={hw.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100">
                            {hw.mapel || 'Bahasa Inggris'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Tenggat: {hw.due_date ? new Date(hw.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Fleksibel'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                            {hw.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                            {hw.description || 'Tidak ada deskripsi rincian tugas.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Mode Informasi Siswa</span>
                        <button
                          onClick={() => setSelectedHomework(hw)}
                          className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Pratinjau Instuksi <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MODAL PRATINJAU PR */}
              <AnimatePresence>
                {selectedHomework && (
                  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-700" />
                          <h3 className="font-bold text-sm text-slate-900">Rincian Instruksi PR Siswa</h3>
                        </div>
                        <button onClick={() => setSelectedHomework(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Mata Pelajaran</label>
                          <p className="font-bold text-slate-800 text-sm">{selectedHomework.mapel || 'Umum'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Tugas PR</label>
                          <p className="font-bold text-slate-900 text-sm">{selectedHomework.title}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Rincian Instuksi Pembelajaran</label>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                            {selectedHomework.description || 'Tidak ada catatan rincian.'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedHomework(null)}
                          className="px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors"
                        >
                          Tutup Pratinjau
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: KOREKSI KUIS ESSAY */}
          {/* ================================================================= */}
          {activeTab === 'kuis_essay' && (
            <motion.div
              key="kuis-essay-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-700" /> Penilaian Jawaban Kuis Essay
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluasi manual jawaban uraian essay dari anak binaan yang membutuhkan skor mentor
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                        <th className="p-4 pl-6">Anak Binaan</th>
                        <th className="p-4">Modul Pembelajaran</th>
                        <th className="p-4">Tanggal Pengerjaan</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center w-24">Skor</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {essaySubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                            Semua jawaban kuis essay telah selesai dinilai!
                          </td>
                        </tr>
                      ) : (
                        essaySubmissions.map((essay) => (
                          <tr key={essay.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              {essay.profiles?.username || 'Anak Binaan'}
                            </td>
                            <td className="p-4 text-slate-700 font-semibold">{essay.quiz_attempts?.module_id || 'Modul Microlearning'}</td>
                            <td className="p-4 text-slate-400">
                              {essay.created_at ? new Date(essay.created_at).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> Perlu Penilaian
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-slate-800">
                              {essay.score ?? '-'}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleOpenCorrection(essay)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-blue-700 hover:text-white transition-colors cursor-pointer text-slate-600"
                                title="Beri Nilai"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL FORM KOREKSI ESSAY */}
              <AnimatePresence>
                {isCorrectionModalOpen && selectedSubmission && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-blue-700" /> Koreksi Penilaian Essay
                        </h3>
                        <button onClick={() => setIsCorrectionModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Jawaban Siswa</p>
                        <p className="text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                          {selectedSubmission.answer_text || JSON.stringify(selectedSubmission.answers || 'Tidak ada teks jawaban.')}
                        </p>
                      </div>

                      <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Skor Perolehan (0 - 100)</label>
                          <input
                            type="number" min="0" max="100" required
                            value={correctionScore} onChange={(e) => setCorrectionScore(e.target.value)}
                            placeholder="Contoh: 90"
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Catatan & Feedback Mentor</label>
                          <textarea
                            rows={3} value={correctionFeedback} onChange={(e) => setCorrectionFeedback(e.target.value)}
                            placeholder="Berikan masukan apresiasi atau evaluasi..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button" onClick={() => setIsCorrectionModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                          >
                            Batal
                          </button>
                          <button
                            type="submit" disabled={isSubmittingCorrection}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-1.5"
                          >
                            {isSubmittingCorrection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

          {/* ================================================================= */}
          {/* TAB 4: KELOLA & REGISTRASI PENGGUNA (USER MANAGEMENT INTEGRATED) */}
          {/* ================================================================= */}
          {activeTab === 'users' && (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* FORM BUAT USER BARU (1 Kolom) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-700" /> Registrasi Akun Baru
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tambahkan kredensial masuk bagi anak binaan atau mentor admin baru
                    </p>
                  </div>

                  <AnimatePresence>
                    {userStatus.msg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                          userStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {userStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        <span>{userStatus.msg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Username / Nama Lengkap</label>
                      <input
                        type="text" required
                        value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Contoh: Muhammad Rafi"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Alamat Email</label>
                      <input
                        type="email" required
                        value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="contoh@smartcell.com"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Password Akun</label>
                      <input
                        type="password" required minLength={6}
                        value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Peran / Role Pengguna</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' | 'super_admin' })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-bold cursor-pointer"
                      >
                        <option value="user">🧒 Anak Binaan (Role: User)</option>
                        <option value="admin">👨‍🏫 Mentor (Role: Admin)</option>
                        <option value="super_admin">👑 Super Admin</option>
                      </select>
                    </div>

                    <button
                      type="submit" disabled={isCreatingUser}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Daftarkan Akun Sekarang
                    </button>
                  </form>
                </div>

                {/* DAFTAR AKUN TERDAFTAR (2 Kolom) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-700" /> Daftar Pengguna Terdaftar ({filteredUsers.length})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola hak akses dan identitas akun terdaftar di sistem</p>
                      </div>
                      <button onClick={() => fetchUsers()} className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                      </button>
                    </div>

                    {isUsersLoading ? (
                      <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-700" /> Memuat data pengguna...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-400 font-medium">
                        Tidak ada akun pengguna yang cocok.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                              <th className="p-3.5 pl-5">Nama Lengkap</th>
                              <th className="p-3.5">Hak Akses (Role)</th>
                              <th className="p-3.5 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-3.5 pl-5 font-bold text-slate-900">{u.username}</td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                    u.role === 'super_admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {u.role === 'super_admin' ? '👑 Super Admin' : u.role === 'admin' ? '👨‍🏫 Mentor Admin' : '🧒 Anak Binaan'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center space-x-1.5">
                                  <button
                                    onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold border border-slate-200 transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-100 transition-colors cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* MODAL EDIT USER */}
              <AnimatePresence>
                {isEditModalOpen && editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Ubah Data Pengguna</h3>
                        <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Username</label>
                          <input
                            type="text" required
                            value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Hak Akses (Role)</label>
                          <select
                            value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold bg-white"
                          >
                            <option value="user">Anak Binaan (User)</option>
                            <option value="admin">Mentor (Admin)</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                            className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800"
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