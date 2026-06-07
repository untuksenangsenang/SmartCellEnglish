'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

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
  }, [id])

  // Fungsi menyimpan jawaban pilihan ganda sementara
  const handleSelectOption = (questionIndex: number, selectedOption: string) => {
    if (quizSubmitted) return // Kunci form jika sudah di-submit
    setUserAnswers({ ...userAnswers, [questionIndex]: selectedOption })
  }

 // Fungsi Koreksi Kuis Otomatis & Simpan ke Database (Terbaru)
  const handleSubmitQuiz = async () => {
    if (!quizData || !quizData.questions) return

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

      // Jika berhasil tersimpan di DB, baru kunci dan tampilkan UI skor ke siswa
      setQuizSubmitted(true)
    } catch (error: any) {
      console.error('Gagal mencatat nilai kuis:', error)
      alert('Nilai berhasil dihitung, tetapi gagal direkam ke server: ' + error.message)
      
      // Tetap kunci kuis agar siswa tahu hasil evaluasinya meskipun internet/DB sempat kendala
      setQuizSubmitted(true)
    }
  }

  if (isLoading) return <div className="p-6 text-center text-sm text-gray-500">Memuat materi...</div>
  if (!moduleData) return <div className="p-6 text-center text-sm text-red-500">Materi tidak ditemukan.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button 
          onClick={() => router.push('/user/modules')}
          className="text-sm text-green-600 hover:underline font-semibold"
        >
          ← Kembali ke Daftar Modul
        </button>

        {/* BOX I: BACAAN MATERI */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{moduleData.title}</h1>
          
          {/* Audio Player Native Speaker */}
          {moduleData.audio_url && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
              <p className="text-xs font-bold text-green-800 mb-1">🎧 Dengarkan Pengucapan Native Speaker:</p>
              <audio src={moduleData.audio_url} controls className="w-full mt-1" />
            </div>
          )}

          {/* Isi Teks Tense/Cerita */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
            {moduleData.content_text}
          </div>
        </div>

        {/* BOX II: KUIS INTERAKTIF */}
        {quizData && quizData.questions && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 space-y-6">
            <div className="border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">📝 {quizData.title}</h2>
              <p className="text-xs text-gray-400 mt-1">Pilihlah satu jawaban yang paling tepat berdasarkan materi di atas.</p>
            </div>

            {/* Loop Soal dari JSONB */}
            {quizData.questions.map((q: any, qIndex: number) => (
              <div key={qIndex} className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  {qIndex + 1}. {q.question}
                </p>

                {/* List Opsi A, B, C, D */}
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((option: string, oIndex: number) => {
                    const isSelected = userAnswers[qIndex] === option
                    const isCorrect = option === q.correct_answer

                    // Pewarnaan tombol saat kuis sudah selesai diperiksa
                    let optionStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    if (isSelected) optionStyle = "border-green-600 bg-green-50 text-green-700 font-medium"
                    
                    if (quizSubmitted) {
                      if (isCorrect) optionStyle = "border-green-500 bg-green-100 text-green-800 font-bold"
                      else if (isSelected && !isCorrect) optionStyle = "border-red-500 bg-red-100 text-red-800"
                      else optionStyle = "border-gray-200 bg-gray-50 text-gray-400 opacity-60"
                    }

                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => handleSelectOption(qIndex, option)}
                        disabled={quizSubmitted}
                        className={`w-full text-left p-3 rounded-lg border text-xs md:text-sm transition flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {quizSubmitted && isCorrect && <span className="text-green-600 font-bold">✓ Benar</span>}
                        {quizSubmitted && isSelected && !isCorrect && <span className="text-red-600 font-bold">✗ Salah</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Tombol Aksi Submit Kuis */}
            {!quizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length < quizData.questions.length}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow transition disabled:bg-gray-300 disabled:text-gray-500"
              >
                Periksa Hasil Kuis & Lihat Nilai
              </button>
            ) : (
              <div className="bg-blue-900 text-white rounded-xl p-6 text-center shadow-md animate-fade-in">
                <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Nilai Evaluasi Kamu</span>
                <h3 className="text-5xl font-mono font-black mt-1 mb-2">{score} / 100</h3>
                <p className="text-xs text-blue-200">
                  {score >= 75 ? 'Selamat! Kamu memahami materi ini dengan sangat baik. 🎉' : 'Jangan berkecil hati, mari baca lagi materinya dan coba lagi nanti! 💪'}
                </p>
                <button
                  onClick={() => {
                    setQuizSubmitted(false)
                    setUserAnswers({})
                  }}
                  className="mt-4 px-4 py-1.5 bg-blue-800 hover:bg-blue-700 text-xs font-semibold rounded-md transition"
                >
                  Coba Jawab Ulang
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}