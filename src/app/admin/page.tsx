'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  HelpCircle, 
  Calendar, 
  User, 
  Edit3, 
  LogOut, 
  X, 
  Loader2, 
  Search, 
  BookOpen, 
  FileText, 
  Award,
  UserPlus,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Filter
} from 'lucide-react'

// Dummy Data untuk visualisasi grafik & statistik
const MAPEL_LIST = ['Semua', 'Bahasa Indonesia', 'Bahasa Inggris', 'Matematika', 'IPA', 'IPS', 'Informatika']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'materi' | 'pr' | 'kuis_essay' | 'users'>('monitoring')
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedMapel, setSelectedMapel] = useState<string>('Semua')

  // State Submissions / Data
  const [prSubmissions, setPrSubmissions] = useState<any[]>([])
  const [essaySubmissions, setEssaySubmissions] = useState<any[]>([])

  // Modal Correction State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [correctionType, setCorrectionType] = useState<'pr' | 'essay'>('pr')
  const [correctionScore, setCorrectionScore] = useState<string>('')
  const [correctionFeedback, setCorrectionFeedback] = useState<string>('')
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false)

  // State Buat User Baru
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin',
  })
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false)

  const handleLogout = () => {
    // Logic logout admin
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingUser(true)
    try {
      // Panggil API Supabase Auth/Users di sini
      alert(`User ${newUser.fullName} berhasil dibuat sebagai ${newUser.role}!`)
      setNewUser({ fullName: '', email: '', password: '', role: 'student' })
    } catch (error: any) {
      alert('Gagal membuat user: ' + error.message)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleOpenCorrection = (submission: any, type: 'pr' | 'essay') => {
    setSelectedSubmission(submission)
    setCorrectionType(type)
    setCorrectionScore(submission.score !== null && submission.score !== undefined ? String(submission.score) : '')
    setCorrectionFeedback(submission.feedback || '')
    setIsCorrectionModalOpen(true)
  }

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCorrection(true)

    try {
      // Logic update database Supabase ke tabel quiz_answers
      setIsCorrectionModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmittingCorrection(false)
    }
  }

  // Filter Submissions berdasarkan nama & mapel
  const filteredPrSubmissions = prSubmissions.filter((sub) => {
    const matchesSearch = sub.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMapel = selectedMapel === 'Semua' || sub.tasks?.mapel === selectedMapel
    return matchesSearch && matchesMapel
  })

  const filteredEssaySubmissions = essaySubmissions.filter((essay) => {
    const matchesSearch = essay.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMapel = selectedMapel === 'Semua' || essay.quizzes?.mapel === selectedMapel
    return matchesSearch && matchesMapel
  })

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* 1. HEADER DASHBOARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Panel Kelola & Koreksi Admin</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Pantau progres pembelajaran multi-mapel, evaluasi tugas PR, buat user, dan koreksi kuis essay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full md:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 2. TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'monitoring'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Monitoring & Grafik
          </button>

          <button
            onClick={() => setActiveTab('pr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pr'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Koreksi Tugas PR
          </button>

          <button
            onClick={() => setActiveTab('kuis_essay')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'kuis_essay'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Koreksi Kuis Essay
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Tambah User Baru
          </button>
        </div>

        {/* 3. MAIN CONTENT CONTAINER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-slate-400 gap-2 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Memuat data...
            </div>
          ) : (
            <div className="p-4">
              <AnimatePresence mode="wait">

                {/* TAB 0: MONITORING & GRAFIK PROGRES */}
                {activeTab === 'monitoring' && (
                  <motion.div
                    key="monitoring-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-6 p-2"
                  >
                    {/* Ringkasan Kartu Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-purple-600">
                          <Users className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase bg-purple-100 px-2 py-0.5 rounded">Total</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">42</p>
                        <p className="text-xs text-slate-500 font-medium">Siswa Terdaftar</p>
                      </div>

                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 px-2 py-0.5 rounded">Selesai</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">128</p>
                        <p className="text-xs text-slate-500 font-medium">Tugas/Kuis Dinilai</p>
                      </div>

                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-amber-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase bg-amber-100 px-2 py-0.5 rounded">Pending</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">14</p>
                        <p className="text-xs text-slate-500 font-medium">Perlu Koreksi</p>
                      </div>

                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-blue-600">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase bg-blue-100 px-2 py-0.5 rounded">Rata-rata</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">84.5</p>
                        <p className="text-xs text-slate-500 font-medium">Nilai Perolehan Siswa</p>
                      </div>
                    </div>

                    {/* Visualisasi Grafik Sederhana (Bar Chart Progres Mapel) */}
                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800">Rata-rata Nilai per Mata Pelajaran</h3>
                      <div className="space-y-3">
                        {[
                          { mapel: 'Bahasa Indonesia', score: 88, color: 'bg-blue-500' },
                          { mapel: 'Bahasa Inggris', score: 82, color: 'bg-purple-500' },
                          { mapel: 'Matematika', score: 76, color: 'bg-indigo-500' },
                          { mapel: 'IPA', score: 85, color: 'bg-emerald-500' },
                          { mapel: 'IPS', score: 90, color: 'bg-amber-500' },
                        ].map((item) => (
                          <div key={item.mapel} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span>{item.mapel}</span>
                              <span>{item.score} / 100</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 1: KOREKSI TUGAS PR */}
                {activeTab === 'pr' && (
                  <motion.div
                    key="pr-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-4"
                  >
                    {/* Filter Per Mapel */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {MAPEL_LIST.map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMapel(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                            selectedMapel === m
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                            <th className="p-4 pl-6">Anak Binaan</th>
                            <th className="p-4">Modul / Judul PR</th>
                            <th className="p-4">Mata Pelajaran</th>
                            <th className="p-4"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tanggal Selesai</span></th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center w-24">Skor</th>
                            <th className="p-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          {filteredPrSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                                Belum ada jawaban Tugas PR yang dikumpulkan untuk mata pelajaran ini.
                              </td>
                            </tr>
                          ) : (
                            filteredPrSubmissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 pl-6 font-black text-slate-900 tracking-tight flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <User className="w-3 h-3" />
                                  </div>
                                  {sub.profiles?.username || 'Anak Binaan'}
                                </td>
                                <td className="p-4 text-slate-700 font-semibold">{sub.tasks?.title || 'Tugas PR'}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                    {sub.tasks?.mapel || 'Umum'}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-400 font-normal">
                                  {new Date(sub.created_at).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </td>
                                <td className="p-4 text-center">
                                  {sub.correction_status === 'corrected' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      <Check className="w-3 h-3" /> Sudah Dinilai
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                      <HelpCircle className="w-3 h-3" /> Perlu Koreksi
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="font-mono font-black text-slate-800">
                                    {sub.score !== null && sub.score !== undefined ? sub.score : '-'}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleOpenCorrection(sub, 'pr')}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-slate-600"
                                    title="Nilai Tugas PR"
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
                  </motion.div>
                )}

                {/* TAB 2: KOREKSI KUIS ESSAY */}
                {activeTab === 'kuis_essay' && (
                  <motion.div
                    key="kuis-essay-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-4"
                  >
                    {/* Filter Per Mapel */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {MAPEL_LIST.map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMapel(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                            selectedMapel === m
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                            <th className="p-4 pl-6">Anak Binaan</th>
                            <th className="p-4">Modul / Paket Kuis</th>
                            <th className="p-4">Mata Pelajaran</th>
                            <th className="p-4"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tanggal Selesai</span></th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center w-24">Skor</th>
                            <th className="p-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          {filteredEssaySubmissions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                                Belum ada jawaban Kuis Essay yang dikumpulkan.
                              </td>
                            </tr>
                          ) : (
                            filteredEssaySubmissions.map((essay) => (
                              <tr key={essay.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 pl-6 font-black text-slate-900 tracking-tight flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <User className="w-3 h-3" />
                                  </div>
                                  {essay.profiles?.username || 'Anak Binaan'}
                                </td>
                                <td className="p-4 text-slate-700 font-semibold">{essay.quizzes?.title || 'Kuis Essay'}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                    {essay.quizzes?.mapel || 'Umum'}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-400 font-normal">
                                  {new Date(essay.created_at).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </td>
                                <td className="p-4 text-center">
                                  {essay.correction_status === 'corrected' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      <Check className="w-3 h-3" /> Sudah Dinilai
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                      <HelpCircle className="w-3 h-3" /> Perlu Koreksi
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="font-mono font-black text-slate-800">
                                    {essay.score !== null && essay.score !== undefined ? essay.score : '-'}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleOpenCorrection(essay, 'essay')}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-slate-600"
                                    title="Nilai Essay"
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
                  </motion.div>
                )}

                {/* TAB 3: BUAT USER BARU */}
                {activeTab === 'users' && (
                  <motion.div
                    key="users-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="max-w-xl mx-auto p-4 space-y-4"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-purple-600" /> Registrasi User Baru (Siswa / Admin)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Tambahkan akun siswa baru atau staf admin ke dalam sistem SmartCell.
                      </p>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Nama Lengkap Siswa/Admin</label>
                        <input
                          type="text"
                          required
                          value={newUser.fullName}
                          onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                          placeholder="Masukkan nama lengkap..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Alamat Email</label>
                        <input
                          type="email"
                          required
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="contoh@smartcell.com"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Password Akun</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Minimal 6 karakter"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Role / Hak Akses</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'student' | 'admin' })}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                        >
                          <option value="student">Siswa / Anak Binaan</option>
                          <option value="admin">Admin / Pengajar</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Buat User Sekarang
                      </button>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 4. LOGOUT BUTTON CONTAINER */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" /> Keluar Sesi Admin
          </button>
        </div>

        {/* 5. MODAL FORM PENILAIAN & KOREKSI */}
        <AnimatePresence>
          {isCorrectionModalOpen && selectedSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-purple-600" />
                    Koreksi Penilaian ({correctionType === 'pr' ? 'Tugas PR' : 'Kuis Essay'})
                  </h3>
                  <button 
                    onClick={() => setIsCorrectionModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* View Input / Jawaban Siswa */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Jawaban Siswa ({selectedSubmission.profiles?.username || 'Anak Binaan'})
                  </p>
                  {correctionType === 'pr' ? (
                    <p className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                      {selectedSubmission.answer_text || 'Tidak ada konten teks yang dilampirkan.'}
                    </p>
                  ) : (
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                      {typeof selectedSubmission.answers === 'string'
                        ? selectedSubmission.answers
                        : JSON.stringify(selectedSubmission.answers, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Form Entry Skor & Catatan */}
                <form onSubmit={handleSubmitCorrection} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Skor Perolehan (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={correctionScore}
                      onChange={(e) => setCorrectionScore(e.target.value)}
                      placeholder="Contoh: 85"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ulasan & Catatan Evaluasi Mentor</label>
                    <textarea
                      rows={3}
                      value={correctionFeedback}
                      onChange={(e) => setCorrectionFeedback(e.target.value)}
                      placeholder="Tuliskan umpan balik untuk membantu pemahaman siswa..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 font-sans resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCorrectionModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCorrection}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
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

      </div>
    </div>
  )
}