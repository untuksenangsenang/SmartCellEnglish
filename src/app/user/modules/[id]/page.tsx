'use client'

import { useEffect, useState } from 'react'
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
  Sparkles
} from 'lucide-react'

export default function ModuleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  // State Data
  const [moduleData, setModuleData] = useState<any>(null)
  const [quizData, setQuizData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // State Manajemen UX Navigasi
  const [activeTab, setActiveTab] = useState<'materi' | 'kuis'>('materi')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)

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
    if (quizSubmitted) return 
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

    const finalScore = Math.round((correctCount / totalQuestions) * 100)
    setScore(finalScore)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')

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

  // Hitung progres pengerjaan kuis (%)
  const totalQuestions = quizData?.questions?.length || 0
  const answeredCount = Object.keys(userAnswers).length
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  const fadeInVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
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
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-6 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Atas: Navigasi Back */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/user/modules')}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Daftar Modul
          </button>
        </div>

        {/* TAB NAVIGATION HEADER (UX SPLIT VIEW) */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('materi')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'materi'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {moduleData.file_url ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            Materi Pembelajaran
          </button>
          
          {quizData && (
            <button
              onClick={() => setActiveTab('kuis')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'kuis'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Kuis Evaluasi {quizSubmitted && '🎉'}
            </button>
          )}
        </div>

        {/* KONTEN UTAMA DENGAN ANIMASI TRANSISI */}
        <AnimatePresence mode="wait">
          {activeTab === 'materi' ? (
            <motion.div
              key="tab-materi"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeInVariants}
              className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6"
            >
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                {moduleData.title}
              </h1>

              {/* Audio Pronunciation */}
              {moduleData.audio_url && (
                <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/80 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-950">Dengarkan Pelafalan:</span>
                  </div>
                  <audio src={moduleData.audio_url} controls className="w-full h-8 accent-emerald-600" />
                </div>
              )}

              {/* Tampilan Konten (PDF vs Teks Cerita) */}
              {moduleData.file_url ? (
                <div className="space-y-4">
                  <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-[480px] md:h-[600px] relative">
                    <iframe
                      src={`${moduleData.file_url}#toolbar=1`}
                      className="w-full h-full border-0"
                      title={`Dokumen: ${moduleData.title}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs font-medium text-slate-400">
                      *Gunakan dua jari jika membuka lewat HP agar zoom lebih lancar.
                    </p>
                    <div className="flex items-center gap-2">
                      <a href={moduleData.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all">
                        <ExternalLink className="w-3 h-3" /> Tab Baru
                      </a>
                      <a href={moduleData.file_url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all">
                        <Download className="w-3 h-3" /> Unduh PDF
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base font-medium">
                  {moduleData.content_text}
                </div>
              )}

              {/* SMART INTERACTIVE FOOTER CTA */}
              {quizData && (
                <div className="pt-6 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('kuis')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer group"
                  >
                    Saya Sudah Selesai Membaca, Mulai Kuis
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* TAB KUIS EVALUASI (MODERN STEPPER LAYOUT) */
            <motion.div
              key="tab-kuis"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeInVariants}
              className="space-y-5"
            >
              {quizData && quizData.questions && !quizSubmitted && (
                <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                  {/* Progress Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        Soal {currentQuestionIndex + 1} dari {totalQuestions}
                      </span>
                      <span>{answeredCount} Terjawab</span>
                    </div>
                    {/* Progress Bar Line */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Pertanyaan Aktif */}
                  <div className="py-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {quizData.questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  {/* Grid Pilihan Ganda dengan Label Abjad A, B, C, D */}
                  <div className="grid grid-cols-1 gap-3">
                    {quizData.questions[currentQuestionIndex].options.map((option: string, oIndex: number) => {
                      const isSelected = userAnswers[currentQuestionIndex] === option
                      const prefixLetter = String.fromCharCode(65 + oIndex) // Menghasilkan A, B, C, D

                      return (
                        <button
                          key={oIndex}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestionIndex, option)}
                          className={`w-full text-left p-4 rounded-xl border text-sm md:text-base transition-all flex items-center gap-3 cursor-pointer group ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold ring-2 ring-emerald-500/10'
                              : 'border-slate-200 bg-white hover:bg-slate-50/70 text-slate-700 font-medium'
                          }`}
                        >
                          {/* Bulatan Huruf Abjad */}
                          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors border ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-600' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-slate-100'
                          }`}>
                            {prefixLetter}
                          </span>
                          <span className="flex-1">{option}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Stepper Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="inline-flex items-center gap-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="inline-flex items-center gap-1 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Berikutnya <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={answeredCount < totalQuestions || isSubmitting}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                          </>
                        ) : (
                          <>
                            Selesai & Kirim Jawaban <Sparkles className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BLOK HASIL AKHIR (JIKA KUIS SUDAH DI-SUBMIT) */}
              {quizSubmitted && (
                <div className="space-y-6">
                  {/* Score Card Dashboard style */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Award className="w-4 h-4" /> Hasil Evaluasi Belajar
                      </span>
                      <h3 className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                        {score} <span className="text-xl text-slate-500 font-sans font-normal">/ 100</span>
                      </h3>
                    </div>
                    
                    <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                      {score >= 75 
                        ? 'Luar biasa! Kamu telah berhasil memahami materi dengan sangat baik. Pertahankan prestasimu! 🎉' 
                        : 'Jangan berkecil hati. Yuk baca kembali materi di tab sebelah secara teliti, lalu coba latih kemampuanmu lagi! 💪'
                      }
                    </p>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setActiveTab('materi')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Baca Ulang Materi
                      </button>
                      <button
                        onClick={() => {
                          setQuizSubmitted(false)
                          setUserAnswers({})
                          setCurrentQuestionIndex(0)
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Coba Ulang Kuis
                      </button>
                    </div>
                  </motion.div>

                  {/* REVIEW JAWABAN (UX TRANSPARANSI BELAJAR) */}
                  <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                    <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase border-b border-slate-100 pb-3">
                      Kunci Jawaban & Review Evaluasi:
                    </h3>
                    {quizData.questions.map((q: any, qIndex: number) => {
                      const isUserCorrect = userAnswers[qIndex] === q.correct_answer
                      return (
                        <div key={qIndex} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5 text-sm">
                          <p className="font-bold text-slate-900 flex items-start gap-2">
                            <span className="text-slate-400">{qIndex + 1}.</span>
                            <span>{q.question}</span>
                          </p>
                          <div className="space-y-1.5 pl-5">
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              Jawaban Kamu: 
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                isUserCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isUserCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {userAnswers[qIndex] || '(Tidak dijawab)'}
                              </span>
                            </p>
                            {!isUserCorrect && (
                              <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded-lg mt-1">
                                💡 Jawaban Benar: <span className="underline">{q.correct_answer}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}