'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Music, 
  HelpCircle, 
  Plus, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

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
      // Validasi: Pastikan kunci jawaban terisi sesuai pilihan ganda
      for (const q of questions) {
        if (!q.question || !q.correct_answer || q.options.some(opt => !opt)) {
          throw new Error('Semua kolom soal, pilihan ganda, dan kunci jawaban wajib ditentukan!')
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
          questions: questions // Array objek disimpan langsung sebagai JSONB otomatis
        })

      if (quizError) throw quizError

      // Jika berhasil, bersihkan form
      setStatus({ success: true, msg: 'Modul Pembelajaran & Paket Kuis berhasil diterbitkan ke sistem!' })
      setModuleTitle('')
      setModuleContent('')
      setAudioUrl('')
      setQuizTitle('')
      setQuestions([{ question: '', options: ['', '', '', ''], correct_answer: '' }])
    } catch (error: any) {
      console.error(error)
      setStatus({ success: false, msg: error.message || 'Gagal memproses penyimpanan materi.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-purple-600 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Tombol Navigasi Kembali */}
        <button 
          onClick={() => router.push('/super-admin')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Panel Utama
        </button>

        {/* Header Judul Halaman */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            CMS: Penerbitan Modul & Kuis
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            Formulir satu pintu untuk mempublikasikan materi microlearning interaktif sekaligus paket evaluasi kuis secara terintegrasi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN I: INPUT MODUL */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Bagian 1: Materi Microlearning
              </h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Judul Modul</label>
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                placeholder="Contoh: Pembelajaran Tense - Simple Past Tense"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Isi Materi Pembelajaran (Teks / Cerita)</label>
              <textarea
                value={moduleContent}
                onChange={(e) => setModuleContent(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all leading-relaxed"
                placeholder="Tuliskan teks narasi atau materi penjelasan bahasa Inggris secara lengkap di sini..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 inline-flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-slate-400" /> 
                URL Audio Pengucapan Native Speaker <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                placeholder="https://example.com/audio-native.mp3"
              />
            </div>
          </motion.div>

          {/* BAGIAN II: INPUT KUIS (DYNAMIC JSONB FORM) */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Bagian 2: Paket Soal Kuis
              </h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Nama / Judul Kuis</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                placeholder="Contoh: Kuis Harian - Evaluasi Past Tense"
              />
            </div>

            {/* Loop Form Pembuatan Soal */}
            <div className="space-y-5 pt-2">
              {questions.map((q, qIndex) => (
                <motion.div 
                  key={qIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      PERTANYAAN #{qIndex + 1}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                    placeholder="Masukkan redaksi pertanyaan kuis..."
                    required
                  />

                  {/* Grid 4 Pilihan Ganda */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-1.5 shadow-2xs">
                        <span className="text-xs font-black text-slate-400">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleQuestionChange(qIndex, 'option', e.target.value, optIndex)}
                          className="w-full bg-transparent border-none p-1 text-xs text-slate-800 focus:outline-none"
                          placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pilih Kunci Jawaban Dropdown Dinamis (Anti-Typo) */}
                  <div className="space-y-1.5 bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700">
                      Kunci Jawaban yang Benar:
                    </label>
                    <select
                      value={q.correct_answer}
                      onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:border-purple-500 focus:outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Opsi Jawaban Benar --</option>
                      {q.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt} disabled={!opt}>
                          Pilihan {String.fromCharCode(65 + oIdx)}: {opt || '(Ketik isi pilihan terlebih dahulu)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestionField}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-50/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris Pertanyaan Baru
            </button>
          </motion.div>

          {/* Tombol Eksekusi Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-purple-200 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sedang Memproses Penyimpanan...
              </>
            ) : (
              'Terbitkan Modul & Kuis Sekarang'
            )}
          </button>
        </form>

        {/* Notifikasi Status Feedback */}
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
              status.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {status.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="font-medium">{status.msg}</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}