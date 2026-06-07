'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Interface untuk struktur soal di dalam JSONB
interface QuestionStructure {
  question: string
  options: string[]
  correct_answer: string
}

export default function ManageMateriPage() {
  const router = useRouter()
  const supabase = createClient()

  // State untuk Data Modul Pembelajaran
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleContent, setModuleContent] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  // State untuk Paket Kuis
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionStructure[]>([
    { question: '', options: ['', '', '', ''], correct_answer: '' }
  ])

  // State Loading & Notifikasi
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; msg?: string }>({})

  // 1. Fungsi Menambah Baris Soal Baru secara Dinamis
  const addQuestionField = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: '' }])
  }

  // 2. Fungsi Mengubah Input Teks Soal atau Pilihan Ganda
  const handleQuestionChange = (index: number, field: string, value: string, optionIndex?: number) => {
    const updatedQuestions = [...questions]
    if (field === 'question') {
      updatedQuestions[index].question = value
    } else if (field === 'correct_answer') {
      updatedQuestions[index].correct_answer = value
    } else if (field === 'option' && optionIndex !== undefined) {
      updatedQuestions[index].options[optionIndex] = value
    }
    setQuestions(updatedQuestions)
  }

  // 3. Fungsi Utama Mengirim Data ke Supabase (Two-Way Insert)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      // Validasi sederhana: Pastikan kunci jawaban terisi sesuai pilihan ganda
      for (const q of questions) {
        if (!q.question || !q.correct_answer || q.options.some(opt => !opt)) {
          throw new Error('Semua kolom soal, pilihan ganda, dan kunci jawaban wajib diisi!')
        }
      }

      // AKSI A: Masukkan data Modul ke tabel `public.modules`
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          title: moduleTitle,
          content_text: moduleContent,
          audio_url: audioUrl || null
        })
        .select()
        .single()

      if (moduleError) throw moduleError

      // AKSI B: Masukkan data Kuis ke tabel `public.quizzes` dengan merelasikan `module_id`
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert({
          module_id: moduleData.id,
          title: quizTitle || `Kuis: ${moduleTitle}`,
          questions: questions // Array objek langsung disimpan sebagai JSONB otomatis oleh Supabase
        })

      if (quizError) throw quizError

      // Jika berhasil, bersihkan form
      setStatus({ success: true, msg: 'Modul Pembelajaran & Paket Kuis berhasil diterbitkan!' })
      setModuleTitle('')
      setModuleContent('')
      setAudioUrl('')
      setQuizTitle('')
      setQuestions([{ question: '', options: ['', '', '', ''], correct_answer: '' }])
    } catch (error: any) {
      console.error(error)
      setStatus({ success: false, msg: error.message || 'Gagal menyimpan data materi.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <button 
          onClick={() => router.push('/super-admin')}
          className="mb-4 text-sm text-purple-700 hover:underline font-semibold"
        >
          ← Kembali ke Panel Utama
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 CMS: Penerbitan Modul & Kuis Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BAGIAN I: INPUT MODUL */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4">
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Bagian 1: Materi Microlearning</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Judul Modul</label>
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="mt-1 w-full rounded-md border p-2 text-gray-900 focus:border-purple-500 focus:outline-none"
                placeholder="Contoh: Pembelajaran Tense - Simple Past Tense"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Isi Materi Pembelajaran (Teks/Cerita)</label>
              <textarea
                value={moduleContent}
                onChange={(e) => setModuleContent(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-md border p-2 text-gray-900 focus:border-purple-500 focus:outline-none"
                placeholder="Tuliskan materi pelajaran bahasa Inggris atau teks bacaan di sini..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">URL Audio Pengucapan Native Speaker (Opsional)</label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="mt-1 w-full rounded-md border p-2 text-gray-900 focus:border-purple-500 focus:outline-none"
                placeholder="https://example.com/audio-native.mp3"
              />
            </div>
          </div>

          {/* BAGIAN II: INPUT KUIS (DYNAMIC JSONB FORM) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Bagian 2: Paket Soal Kuis</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama/Judul Kuis</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="mt-1 w-full rounded-md border p-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                placeholder="Contoh: Kuis Harian - Evaluasi Past Tense"
              />
            </div>

            {/* Loop Form Pembuatan Soal */}
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-gray-500">Pertanyaan #{qIndex + 1}</span>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  className="w-full rounded-md border p-2 text-sm text-gray-900 focus:outline-blue-500"
                  placeholder="Masukkan kalimat pertanyaan kuis..."
                  required
                />

                {/* Grid 4 Pilihan Ganda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + optIndex)}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleQuestionChange(qIndex, 'option', e.target.value, optIndex)}
                        className="w-full rounded border p-1.5 text-xs text-gray-900 focus:outline-blue-400"
                        placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Pilih Kunci Jawaban */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kunci Jawaban yang Benar (Tulis Sama Persis):</label>
                  <input
                    type="text"
                    value={q.correct_answer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                    className="w-full rounded border p-1.5 text-xs text-green-700 font-semibold bg-green-50 focus:outline-green-500"
                    placeholder="Tuliskan teks jawaban yang benar dari pilihan di atas..."
                    required
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestionField}
              className="w-full py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100/50 transition"
            >
              ➕ Tambah Baris Pertanyaan Baru
            </button>
          </div>

          {/* Tombol Aksi Akhir */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow transition disabled:bg-gray-400"
          >
            {isLoading ? 'Sedang Memproses Penyimpanan...' : '🚀 Terbitkan Modul & Kuis Sekarang'}
          </button>
        </form>

        {/* Notifikasi Status */}
        {status.msg && (
          <div className={`mt-4 p-4 rounded-lg text-sm text-center font-medium ${status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status.success ? '✅ ' : '⚠️ '} {status.msg}
          </div>
        )}
      </div>
    </div>
  )
}