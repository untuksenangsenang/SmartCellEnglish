'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  UserPlus, 
  ArrowRight, 
  ShieldAlert, 
  Lock,
  Video,
  ClipboardList
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    const getAdminData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setAdminEmail(user.email)
      }
    }
    getAdminData()
  }, [supabase])

  // Konfigurasi Menu Kontrol Utama Super Admin (Kini Berjumlah 4 Kolom Grid)
  const menuItems = [
    {
      title: "CMS Konten Materi",
      desc: "Operasi manajemen penuh CRUD data Modul Pembelajaran microlearning beserta paket bundel soal Kuis evaluasi.",
      icon: BookOpen,
      bgColor: "bg-blue-900/10 text-blue-800",
      borderHover: "hover:border-blue-400 hover:shadow-blue-100/50",
      link: "/super-admin/manage-materi",
      actionText: "Kelola Materi"
    },
    {
      title: "Kelola Pengguna",
      desc: "Daftarkan hak kredensial akun baru bagi Anak Binaan didik untuk akses sistem aplikasi pembelajaran mandiri.",
      icon: UserPlus,
      bgColor: "bg-blue-100 text-blue-700",
      borderHover: "hover:border-blue-300 hover:shadow-blue-100/50",
      link: "/super-admin/manage-users",
      actionText: "Registrasi Akun"
    },
    {
      title: "Manajemen Video",
      desc: "Unggah, pantau, dan kelola tautan video pembelajaran interaktif dari YouTube Smart Cell English untuk ruang belajar siswa.",
      icon: Video,
      bgColor: "bg-blue-50 text-blue-600",
      borderHover: "hover:border-blue-200 hover:shadow-blue-100/50",
      link: "/super-admin/manage-videos",
      actionText: "Kelola Video"
    },
    {
      title: "Pekerjaan Rumah (PR)",
      desc: "Unggah, rancang, dan kategorikan tugas Pekerjaan Rumah (PR) bagi siswa berdasarkan kategori Mata Pelajaran (Mapel).",
      icon: ClipboardList,
      bgColor: "bg-sky-50 text-sky-600",
      borderHover: "hover:border-sky-300 hover:shadow-sky-100/50",
      link: "/super-admin/manage-homework",
      actionText: "Kelola PR"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 selection:bg-blue-200 selection:text-blue-900">
      
      {/* Konten Utama Container */}
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-16">
        
        {/* Banner Selamat Datang & Jumbotron Utama */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg"
        >
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <Lock className="w-72 h-72" />
          </div>
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" /> Master Control Developer Root
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Sistem Kontrol Utama 🛠️
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Hak akses penuh pengembang untuk pengelolaan parameter konfigurasi data instruktur mentor, manajemen enkapsulasi akun binaan, serta kontrol penuh CMS produksi modul edukasi.
            </p>
          </div>
        </motion.div>

        {/* Grid Aktivitas Kontrol (4 Kolom Grid) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
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
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {item.actionText}
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}