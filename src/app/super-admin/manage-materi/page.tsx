'use client'

import { useState } from 'react'
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
  AlertCircle,
  UploadCloud
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

  // State Mode Konten: 'text' (Teks & Audio) atau 'file' (PDF/Word)
  const [contentType, setContentType] = useState<'text' | 'file'>('text')

  // State untuk Efek Visual Drag & Drop
  const [isDragActive, setIsDragActive] = useState(false)

  // State untuk Data Modul Pembelajaran
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleContent, setModuleContent] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [fileDoc, setFileDoc] = useState<File | null>(null)

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

  // 3. Fungsi Utama Mengirim Data ke Supabase (Two-Way Insert + Storage Upload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      // Validasi Kuis: Pastikan kunci jawaban terisi sesuai pilihan ganda
      for (const q of questions) {
        if (!q.question || !q.correct_answer || q.options.some(opt => !opt)) {
          throw new Error('Semua kolom soal, pilihan ganda, dan kunci jawaban wajib ditentukan!')
        }
      }

      let uploadedFileUrl = null
      let uploadedFileType = null

      // PROSES ALUR UPLOAD FILE (Jika memilih tipe dokumen)
      if (contentType === 'file') {
        if (!fileDoc) {
          throw new Error('Silakan pilih atau jatuhkan file PDF/Word terlebih dahulu!')
        }

        const fileExt = fileDoc.name.split('.').pop()?.toLowerCase()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `documents/${fileName}`

        // Unggah file ke bucket storage 'modules'
        const { error: uploadError } = await supabase.storage
          .from('modules')
          .upload(filePath, fileDoc)

        if (uploadError) throw uploadError

        // Dapatkan URL Publik dari berkas yang diunggah
        const { data: { publicUrl } } = supabase.storage
          .from('modules')
          .getPublicUrl(filePath)

        uploadedFileUrl = publicUrl
        uploadedFileType = fileExt
      }

      // AKSI A: Masukkan data Modul ke tabel `public.modules` 
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          title: moduleTitle,
          content_text: contentType === 'text' ? moduleContent : '',
          audio_url: contentType === 'text' ? (audioUrl || null) : null,
          file_url: contentType === 'file' ? uploadedFileUrl : null,
          file_type: contentType === 'file' ? uploadedFileType : null
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
          questions: questions 
        })

      if (quizError) throw quizError

      // Jika berhasil, bersihkan seluruh form
      setStatus({ success: true, msg: 'Modul Pembelajaran & Paket Kuis berhasil diterbitkan ke sistem!' })
      setModuleTitle('')
      setModuleContent('')
      setAudioUrl('')
      setFileDoc(null)
      setQuizTitle('')
      setContentType('text')
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
          type="button"
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
            Formulir satu pintu untuk mempublikasikan materi microlearning interaktif (Teks/Dokumen) sekaligus paket evaluasi kuis secara terintegrasi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN I: INPUT MODUL */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Bagian 1: Materi Microlearning
                </h3>
              </div>

              {/* Selector Tipe Konten Baru (Teks vs File) */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setContentType('text')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    contentType === 'text' 
                      ? 'bg-white text-purple-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Teks & Audio
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('file')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    contentType === 'file' 
                      ? 'bg-white text-purple-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3 h-3" /> File Dokumen
                </button>
              </div>
            </div>
            
            {/* Judul Modul */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Judul Modul</label>
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                placeholder="Contoh: Reading Section - Narrative Text Part 1"
                required
              />
            </div>

            {/* FORM CONDITIONAL RENDERING BERDASARKAN TIPE KONTEN */}
            {contentType === 'text' ? (
              /* SUB-OPSI A: INPUT BERBASIS TEKS & AUDIO */
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Isi Materi Pembelajaran (Teks / Cerita)</label>
                  <textarea
                    value={moduleContent}
                    onChange={(e) => setModuleContent(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all leading-relaxed"
                    placeholder="Tuliskan teks narasi atau materi penjelasan bahasa Inggris secara lengkap di sini..."
                    required={contentType === 'text'}
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
            ) : (
              /* SUB-OPSI B: DRAG & DROP FILE DOKUMEN */
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-slate-700 block">Unggah Dokumen Pembelajaran</label>
                
                {/* Kotak Area Drop yang Reaktif Mengikuti State isDragActive */}
                <div className={`w-full border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center relative group ${
                  isDragActive 
                    ? 'border-purple-600 bg-purple-50/80 scale-[1.01] shadow-md shadow-purple-100' 
                    : 'border-slate-200 bg-slate-50/50 hover:border-purple-400'
                }`}>
                  <input 
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFileDoc(e.target.files?.[0] || null)}
                    onDragEnter={() => setIsDragActive(true)}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={() => setIsDragActive(false)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required={contentType === 'file'}
                  />
                  <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${
                    isDragActive ? 'text-purple-600 animate-bounce' : 'text-slate-400 group-hover:text-purple-500'
                  }`} />
                  
                  <span className="text-sm font-bold text-slate-700 block">
                    {fileDoc ? fileDoc.name : 'Pilih atau Jatuhkan berkas Word (.doc, .docx) atau PDF di sini'}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    {fileDoc ? `Ukuran: ${(fileDoc.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimal ukuran file disarankan 10MB'}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* BAGIAN II: INPUT KUIS */}
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
                placeholder="Contoh: Kuis Evaluasi Pemahaman Modul"
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

                  {/* Kunci Jawaban Dropdown */}
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