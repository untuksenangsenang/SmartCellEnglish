'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Mic, 
  Video, 
  ArrowRight, 
  GraduationCap, 
  Award, 
  Settings, 
  X, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PenLine
} from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  // State Utama Auth & Profil
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [username, setUsername] = useState('')
  
  // State Modal Pengaturan
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputName, setInputName] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Ambil data user & profile dari Supabase
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
        
        // Ambil data nama/username dari tabel profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        
        if (profile?.username) {
          setUsername(profile.username)
          setInputName(profile.username) // Set default input value
        }
      }
    }
    getUserData()
  }, [supabase])

  // Handler update nama dan password
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)

    try {
      // 1. Jalankan update nama di tabel profiles jika input tidak kosong
      if (inputName.trim() && inputName !== username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: inputName.trim() })
          .eq('id', userId)
        
        if (profileError) throw new Error("Gagal memperbarui nama: " + profileError.message)
        setUsername(inputName.trim())
      }

      // 2. Jalankan update password ke Supabase Auth jika diisi
      if (inputPassword) {
        if (inputPassword.length < 6) {
          throw new Error("Password baru minimal harus berisikan 6 karakter!")
        }
        const { error: authError } = await supabase.auth.updateUser({
          password: inputPassword
        })

        if (authError) throw new Error("Gagal memperbarui password: " + authError.message)
        setInputPassword('') // Reset form password setelah sukses
      }

      setStatusMessage({ type: 'success', text: 'Profil & Keamanan akun Anda berhasil diperbarui!' })
      setTimeout(() => setIsModalOpen(false), 2000) // Tutup otomatis setelah sukses
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Terjadi kesalahan sistem.' })
    } finally {
      setIsSaving(false)
    }
  }

  const menuItems = [
  {
    title: "Microlearning Modules",
    desc: "Pelajari materi bahasa Inggris harian ringkas yang dilengkapi dengan audio langsung dari penutur asli.",
    icon: BookOpen,
    bgColor: "bg-emerald-50 text-emerald-600",
    borderHover: "hover:border-emerald-300 hover:shadow-emerald-100/50",
    link: "/user/modules",
    actionText: "Buka Materi",
    accentColor: "group-hover:text-emerald-600"
  },
  {
    title: "Kuis & Evaluasi",
    desc: "Kerjakan kuis evaluasi mandiri berisi soal Pilihan Ganda dan Essay. Pantau hasil skor serta feedback dari mentor.",
    icon: PenLine,
    bgColor: "bg-purple-50 text-purple-600",
    borderHover: "hover:border-purple-300 hover:shadow-purple-100/50",
    link: "/user/quizzes",
    actionText: "Mulai Kuis",
    accentColor: "group-hover:text-purple-600"
  },
  {
    title: "Podcast Recorder (.MP3)",
    desc: "Ruang ekspresi dan sesi praktik speaking. Rekam suaramu langsung di browser lalu kumpulkan ke mentor.",
    icon: Mic,
    bgColor: "bg-teal-50 text-teal-600",
    borderHover: "hover:border-teal-300 hover:shadow-teal-100/50",
    link: "/user/podcast",
    actionText: "Mulai Rekaman",
    accentColor: "group-hover:text-teal-600"
  },
  {
    title: "Video Learning",
    desc: "Tonton video edukasi interaktif pilihan untuk meningkatkan pemahaman listening dan struktur bahasamu.",
    icon: Video,
    bgColor: "bg-amber-50 text-amber-600",
    borderHover: "hover:border-amber-300 hover:shadow-amber-100/50",
    link: "/user/videos",
    actionText: "Tonton Video",
    accentColor: "group-hover:text-amber-600"
  }
]

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        
        {/* Banner Selamat Datang */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <GraduationCap className="w-72 h-72" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" /> Portal Ruang Belajar Anak Binaan
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome Back, {username || 'Siswa'}! 👋
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Selamat datang di ruang belajar mandiri Anda. Semangat belajar! Pilih salah satu menu aktivitas interaktif di bawah untuk memulai bimbingan hari ini.
              </p>
            </div>

            {/* Tombol Akses Pengaturan Profil */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true)
                  setStatusMessage(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
              >
                <Settings className="w-4 h-4" /> Pengaturan Akun
              </button>
            </div>
          </div>
        </motion.div>

        {/* Grid Aktivitas Belajar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {menuItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between ${item.borderHover}`}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center font-bold transition-all duration-300 group-hover:scale-105`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className={`text-lg font-bold text-slate-900 tracking-tight transition-colors ${item.accentColor}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => router.push(item.link)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {item.actionText}
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* 🔐 MODAL DIALOG PENGATURAN PROFIL & KEAMANAN */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Blur Gelap */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Konten Kotak Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Header Modal */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-emerald-600" /> Pengaturan Profil Mandiri
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">Kelola identitas personal dan sandi login Anda</p>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Input Body */}
              <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                
                {/* 1. Input Ubah Nama */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Nama Lengkap Anda
                  </label>
                  <input 
                    type="text"
                    required
                    disabled={isSaving}
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Masukkan nama lengkap baru Anda..."
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-800 placeholder:text-slate-400 shadow-2xs"
                  />
                </div>

                {/* 2. Input Ubah Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Kata Sandi Baru
                  </label>
                  <input 
                    type="password"
                    disabled={isSaving}
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Isi jika ingin mengganti sandi bawaan..."
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-800 placeholder:text-slate-400 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    *Kosongkan kolom sandi jika Anda hanya berniat mengganti nama saja.
                  </p>
                </div>

                {/* Tampilan Notifikasi Status Sukses/Eror */}
                {statusMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl flex items-start gap-2 text-xs font-semibold border ${
                      statusMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span className="leading-tight">{statusMessage.text}</span>
                  </motion.div>
                )}

                {/* Tombol Aksi Form */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>

              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </div>
  )
}