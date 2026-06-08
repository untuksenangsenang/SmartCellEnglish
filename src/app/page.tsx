'use client'

import { useRouter } from 'next/navigation'
import { motion, Variants } from 'framer-motion'
import { BookOpen, Mic, Target, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  // Varian Animasi Framer Motion
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' } 
    }
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  return (
    <div className="w-full bg-slate-50 text-slate-800 scroll-smooth selection:bg-emerald-500 selection:text-white">
      
      {/* 1. HERO SECTION (Tinggi disesuaikan dengan dikurangi tinggi navbar global) */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 overflow-hidden bg-radial from-emerald-50 via-transparent to-transparent">
        {/* Ornamen Latar Belakang Beranimasi */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-10 -left-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-4xl text-center z-10 space-y-6 isolation-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-widest rounded-full shadow-xs"
          >
            Digital Learning Ecosystem
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight"
          >
            Empowering Futures Through <br/>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              English Literacy
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            Ruang bimbingan dan pembelajaran bahasa Inggris mandiri yang dirancang khusus untuk mendukung potensi, kreativitas, dan masa depan Anak Binaan.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={() => router.push('/login')}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-300"
            >
              Mulai Belajar Sekarang
            </button>
            <a 
              href="#features"
              className="px-8 py-3.5 bg-white text-slate-700 font-bold rounded-xl border border-gray-200 shadow-xs hover:bg-gray-50 hover:text-slate-900 transition-all duration-300 flex items-center justify-center gap-1"
            >
              Pelajari Fitur ↓
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. CORE FEATURES SECTION */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-100">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center max-w-2xl mx-auto mb-16 space-y-2"
        >
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Metode Pembelajaran Interaktif</h2>
          <p className="text-sm md:text-base text-slate-500">Dikembangkan berdasarkan kebutuhan kurikulum microlearning yang taktis, ringkas, dan menyenangkan.</p>
        </motion.div>

        {/* Grid Fitur Utama */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Card 1: Microlearning */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="border border-gray-100 rounded-2xl p-8 bg-white shadow-xs hover:shadow-xl hover:border-emerald-100 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Microlearning Modules</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Pelajari materi bahasa Inggris harian ringkas yang dilengkapi audio langsung dari penutur asli (*native speaker*).</p>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 hover:underline"
            >
              Lihat Materi 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Card 2: Podcast Recorder */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="border border-gray-100 rounded-2xl p-8 bg-white shadow-xs hover:shadow-xl hover:border-emerald-100 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Podcast Recorder (.MP4)</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Ruang ekspresi dan praktik *speaking*. Rekam suaramu secara langsung di browser dan unggah berkas tugas ke Cloud Mentor.</p>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="text-sm font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1 hover:underline"
            >
              Mulai Rekaman 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Card 3: Interactive Quiz */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="border border-gray-100 rounded-2xl p-8 bg-white shadow-xs hover:shadow-xl hover:border-emerald-100 transition-all group flex flex-col justify-between md:col-span-2 lg:col-span-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Automated Quizzes</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Uji pemahaman belajarmu dengan evaluasi soal dinamis. Hasil skor langsung dikalkulasi otomatis dan dikirim ke panel pemantauan.</p>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="text-sm font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              Uji Kemampuan 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. CALL TO ACTION SECTION (Diubah murni menjadi penutup seksi sebelum menempel ke global footer) */}
      <section className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-2xl mx-auto space-y-6 relative z-10"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Siap Melangkah Lebih Jauh?</h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Gunakan kredensial akun internal yang telah didaftarkan oleh Administrator untuk masuk ke sistem monitoring bimbingan.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-sm shadow-md transition-all duration-300"
            >
              Masuk Ke Portal Belajar
            </button>
          </div>
        </motion.div>
      </section>

    </div>
  )
}