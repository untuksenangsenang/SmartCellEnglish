'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, Variants } from 'framer-motion'
import { ArrowLeft, Headphones, CheckCircle2, XCircle, Award, RefreshCw, Loader2, BookOpen, HelpCircle } from 'lucide-react'

export default function ModuleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  // State Data
  const [moduleData, setModuleData] = useState<any>(null)
  const [quizData, setQuizData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // State Kuis Interaktif
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchModuleAndQuiz = async () => {
      // 1. Ambil data Modul berdasarkan ID URL
      const { data: moduleRes } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single()

      // 2. Ambil data Kuis yang terelasi dengan module_id ini
      const { data: quizRes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', id)
        .single()

      if (moduleRes) setModuleData(moduleRes)
      if (quizRes) setQuizData(quizRes)
      setIsLoading(false)
    }

    if (id) fetchModuleAndQuiz()
  }, [id, supabase])

  // Fungsi menyimpan jawaban pilihan ganda sementara
  const handleSelectOption = (questionIndex: number, selectedOption: string) => {
    if (quizSubmitted) return // Kunci form jika sudah di-submit
    setUserAnswers({ ...userAnswers, [questionIndex]: selectedOption })
  }

  // Fungsi Koreksi Kuis Otomatis & Simpan ke Database
  const handleSubmitQuiz = async () => {
    if (!quizData || !quizData.questions) return
    setIsSubmitting(true)

    let correctCount = 0
    const totalQuestions = quizData.questions.length

    quizData.questions.forEach((q: any, index: number) => {
      if (userAnswers[index] === q.correct_answer) {
        correctCount++
      }
    })

    // Hitung nilai akhir skala 0 - 100
    const finalScore = Math.round((correctCount / totalQuestions) * 100)
    setScore(finalScore)

    try {
      // 1. Ambil session user aktif untuk mendapatkan ID Anak Binaan yang sedang login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')

      // 2. Kirim data skor ke tabel quiz_attempts di Supabase
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizData.id,
          score: finalScore
        })

      if (error) throw error

      setQuizSubmitted(true)
    } catch (error: any) {
      console.error('Gagal mencatat nilai kuis:', error)
      alert('Nilai berhasil dihitung, tetapi gagal direkam ke server: ' + error.message)
      setQuizSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Definisikan Tipe Animasi secara Terbuka dan Aman dari Error TypeScript
  const fadeInVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 100, damping: 15 } 
    }
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 tracking-wide">Memuat modul pembelajaran...</p>
      </div>
    )
  }

  if (!moduleData) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-base font-bold text-red-600">Materi bimbingan tidak ditemukan atau telah dihapus.</p>
      </div>
    )
  }

  return (
    // Background murni putih (bg-white) sesuai preferensi utama
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-7 pb-20">
        
        {/* Tombol Navigasi Kembali */}
        <div>
          <button 
            onClick={() => router.push('/user/modules')}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Daftar Modul
          </button>
        </div>

        {/* BOX I: BACAAN MATERI UTAMA */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={fadeInVariants}
          className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-xs"
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 w-fit text-slate-500 text-xs font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Reading Activity
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mb-6 leading-tight">
            {moduleData.title}
          </h1>
          
          {/* Audio Player Terintegrasi Native Speaker */}
          {moduleData.audio_url && (
            <div className="bg-emerald-50/60 rounded-xl p-4 mb-8 border border-emerald-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-950 block">Native Pronunciation:</span>
              </div>
              <audio src={moduleData.audio_url} controls className="w-full h-9 accent-emerald-600" />
            </div>
          )}

          {/* Wrapper Isi Teks Deskripsi Materi */}
          <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base tracking-normal font-medium">
            {moduleData.content_text}
          </div>
        </motion.div>

        {/* BOX II: KUIS EVALUASI INTERAKTIF */}
        {quizData && quizData.questions && (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={fadeInVariants}
            className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-8"
          >
            <div className="border-b border-slate-100 pb-5 space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
                <HelpCircle className="w-6 h-6 text-emerald-600" />
                {quizData.title}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Pilihlah salah satu opsi jawaban di bawah ini dengan cermat berdasarkan materi membaca di atas.
              </p>
            </div>

            {/* Render Iterasi Soal JSONB */}
            {quizData.questions.map((q: any, qIndex: number) => (
              <div key={qIndex} className="space-y-4">
                <p className="text-base font-extrabold text-slate-900 leading-snug">
                  <span className="text-emerald-600">{qIndex + 1}.</span> {q.question}
                </p>

                {/* Grid Pilihan Jawaban A, B, C, D */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((option: string, oIndex: number) => {
                    const isSelected = userAnswers[qIndex] === option
                    const isCorrect = option === q.correct_answer

                    // Logika Styling Tombol Berdasarkan Status Pengiriman Form Kuis
                    let optionStyle = "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 font-medium"
                    
                    if (isSelected) {
                      optionStyle = "border-emerald-500 bg-emerald-50/50 text-emerald-700 font-bold ring-2 ring-emerald-500/10"
                    }
                    
                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500 bg-emerald-100 text-emerald-900 font-black shadow-xs"
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "border-red-400 bg-red-100 text-red-900 font-bold"
                      } else {
                        optionStyle = "border-slate-200 bg-slate-50/40 text-slate-400 opacity-50 cursor-not-allowed"
                      }
                    }

                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => handleSelectOption(qIndex, option)}
                        disabled={quizSubmitted || isSubmitting}
                        className={`w-full text-left p-4 rounded-xl border text-sm md:text-base transition-all flex items-center justify-between cursor-pointer disabled:cursor-not-allowed group ${optionStyle}`}
                      >
                        <span className="pr-4">{option}</span>
                        {quizSubmitted && isCorrect && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs shrink-0 bg-emerald-200/50 px-2.5 py-1 rounded-md border border-emerald-300/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Benar
                          </span>
                        )}
                        {quizSubmitted && isSelected && !isCorrect && (
                          <span className="text-red-700 font-bold flex items-center gap-1 text-xs shrink-0 bg-red-200/50 px-2.5 py-1 rounded-md border border-red-300/30">
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> Salah
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Manajemen Blok Tombol Submit / Tampilan Hasil Akhir */}
            {!quizSubmitted ? (
              <div className="pt-4">
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(userAnswers).length < quizData.questions.length || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengecek & Menyimpan Nilai...
                    </>
                  ) : (
                    'Periksa Hasil Kuis & Lihat Nilai'
                  )}
                </button>
              </div>
            ) : (
              /* Blok Informasi Hasil Kelulusan Siswa */
              <motion.div 
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4" /> Hasil Evaluasi Mandiri
                  </span>
                  <h3 className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                    {score} <span className="text-xl text-slate-500 font-sans font-normal">/ 100</span>
                  </h3>
                </div>
                
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {score >= 75 
                    ? 'Luar biasa! Kamu telah berhasil memahami materi bacaan ini dengan sangat baik. Pertahankan prestasimu! 🎉' 
                    : 'Jangan berkecil hati. Mari baca kembali materi di atas dengan lebih teliti, lalu coba latih kembali kemampuanmu! 💪'
                  }
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setQuizSubmitted(false)
                      setUserAnswers({})
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Jawab Ulang Kuis
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}