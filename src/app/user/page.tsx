'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { BookOpen, Mic, Video, CheckSquare, ArrowRight, GraduationCap, Award } from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [supabase])

  const menuItems = [
    {
      title: "Microlearning Modules",
      desc: "Pelajari materi bahasa Inggris harian ringkas yang dilengkapi dengan audio langsung dari penutur asli.",
      icon: BookOpen,
      bgColor: "bg-emerald-50 text-emerald-600",
      borderHover: "hover:border-emerald-300 hover:shadow-emerald-100/50",
      link: "/user/modules",
      actionText: "Buka Materi"
    },
    {
      title: "Podcast Recorder (.MP4)",
      desc: "Ruang ekspresi dan sesi praktik speaking. Rekam suaramu langsung di browser lalu kumpulkan ke mentor.",
      icon: Mic,
      bgColor: "bg-teal-50 text-teal-600",
      borderHover: "hover:border-teal-300 hover:shadow-teal-100/50",
      link: "/user/podcast",
      actionText: "Mulai Rekaman"
    },
    {
      title: "Video Learning",
      desc: "Tonton video edukasi interaktif pilihan untuk meningkatkan pemahaman listening dan struktur bahasamu.",
      icon: Video,
      bgColor: "bg-amber-50 text-amber-600",
      borderHover: "hover:border-amber-300 hover:shadow-amber-100/50",
      link: "/user/videos",
      actionText: "Tonton Video"
    }
  ]

  return (
    // Main Container diubah menjadi bg-white murni
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
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" /> Portal Ruang Belajar Anak Binaan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome Back! 👋
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Selamat datang di ruang belajar mandiri Anda. Semangat belajar! Pilih salah satu menu aktivitas interaktif di bawah untuk memulai bimbingan hari ini.
            </p>
          </div>
        </motion.div>

        {/* Grid Aktivitas Belajar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {menuItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              // Border diubah menjadi border-slate-200/80 agar pembatas kartu tetap terlihat tegas di background putih murni
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between ${item.borderHover}`}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center font-bold transition-all duration-300 group-hover:scale-105`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
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
    </div>
  )
}