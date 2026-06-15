'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
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
  UploadCloud,
  Edit3,
  Trash2,
  ListFilter,
  Eye
} from 'lucide-react'

// Interface untuk struktur soal di dalam JSONB
interface QuestionStructure {
  question: string
  options: string[]
  correct_answer: string
}

// Interface untuk data Modul dari Supabase
interface ModuleData {
  id: string
  created_at?: string
  title: string
  content_text: string | null
  audio_url: string | null
  file_url: string | null
  file_type: string | null
}

export default function ManageMateriPage() {
  const router = useRouter()
  const supabase = createClient()

  // STATE MANAJEMEN VIEW CRUD
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [modulesList, setModulesList] = useState<ModuleData[]>([])
  const [isFetching, setIsFetching] = useState(true)
  
  // State tracking ID untuk mode Update
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  // State Mode Konten Form: 'text' (Teks & Audio) atau 'file' (PDF/Word)
  const [contentType, setContentType] = useState<'text' | 'file'>('text')
  const [isDragActive, setIsDragActive] = useState(false)

  // State untuk Data Modul Pembelajaran (Form)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleContent, setModuleContent] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [fileDoc, setFileDoc] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [existingFileType, setExistingFileType] = useState<string | null>(null)

  // State untuk Paket Kuis (Form)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionStructure[]>([
    { question: '', options: ['', '', '', ''], correct_answer: '' }
  ])

  // State Loading & Notifikasi
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; msg?: string }>({})

  // ==========================================
  // [READ] FUNGSI MENGAMBIL SEMUA DATA MODUL
  // ==========================================
  const fetchModules = useCallback(async () => {
    setIsFetching(true)
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setModulesList(data || [])
    } catch (err: any) {
      console.error('Gagal mengambil list modul:', err)
    } finally {
      setIsFetching(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  // Helper reset form & kembali ke list
  const resetFormToInitial = () => {
    setEditingModuleId(null)
    setEditingQuizId(null)
    setModuleTitle('')
    setModuleContent('')
    setAudioUrl('')
    setFileDoc(null)
    setExistingFileUrl(null)
    setExistingFileType(null)
    setQuizTitle('')
    setContentType('text')
    setQuestions([{ question: '', options: ['', '', '', ''], correct_answer: '' }])
    setViewMode('list')
    setStatus({})
  }

  // ==========================================
  // [UPDATE] PRE-FILL DATA KETIKA KLIK EDIT
  // ==========================================
  const handleEditClick = async (module: ModuleData) => {
    setIsLoading(true)
    setStatus({})
    setEditingModuleId(module.id)
    
    // Set data modul ke form
    setModuleTitle(module.title)
    if (module.file_url) {
      setContentType('file')
      setExistingFileUrl(module.file_url)
      setExistingFileType(module.file_type)
      setModuleContent('')
      setAudioUrl('')
    } else {
      setContentType('text')
      setModuleContent(module.content_text || '')
      setAudioUrl(module.audio_url || '')
      setExistingFileUrl(null)
      setExistingFileType(null)
    }

    // Ambil data kuis yang berelasi dengan module ini
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', module.id)
        .maybeSingle()

      if (quizError) throw quizError

      if (quizData) {
        setEditingQuizId(quizData.id)
        setQuizTitle(quizData.title)
        setQuestions(quizData.questions || [
          { question: '', options: ['', '', '', ''], correct_answer: '' }
        ])
      } else {
        // Jika modul tidak punya kuis, sediakan form kosong
        setEditingQuizId(null)
        setQuizTitle('')
        setQuestions([{ question: '', options: ['', '', '', ''], correct_answer: '' }])
      }
      
      setViewMode('form')
    } catch (err: any) {
      console.error(err)
      alert('Gagal mengambil data kuis pelengkap.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // [DELETE] FUNGSI MENGHAPUS MODUL & KUIS
  // ==========================================
  const handleDeleteClick = async (moduleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ini beserta kuis di dalamnya?')) return

    try {
      // 1. Hapus kuis terlebih dahulu karena berelasi dengan foreign key module_id
      const { error: quizDelError } = await supabase
        .from('quizzes')
        .delete()
        .eq('module_id', moduleId)

      if (quizDelError) throw quizDelError

      // 2. Hapus modul
      const { error: moduleDelError } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (moduleDelError) throw moduleDelError

      alert('Materi dan kuis berhasil dieliminasi dari sistem.')
      fetchModules() // Refresh data list
    } catch (err: any) {
      console.error(err)
      alert(`Gagal menghapus data: ${err.message}`)
    }
  }

  // Fungsi Dinamis Soal
  const addQuestionField = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: '' }])
  }

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

  // =======================================================
  // [CREATE & UPDATE] HANDLER SUBMIT FORM (ONE-GATEWAY LOGIC)
  // =======================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      // Validasi Kuis
      for (const q of questions) {
        if (!q.question || !q.correct_answer || q.options.some(opt => !opt)) {
          throw new Error('Semua kolom soal, pilihan ganda, dan kunci jawaban wajib ditentukan!')
        }
      }

      let uploadedFileUrl = existingFileUrl
      let uploadedFileType = existingFileType

      // Alur penanganan dokumen jika modenya file
      if (contentType === 'file') {
        if (!fileDoc && !existingFileUrl) {
          throw new Error('Silakan pilih atau jatuhkan file PDF/Word terlebih dahulu!')
        }

        // Jika ada file baru yang dimasukkan (menggantikan yang lama atau baru pertama kali)
        if (fileDoc) {
          const fileExt = fileDoc.name.split('.').pop()?.toLowerCase() || ''
          const fileName = `${Date.now()}.${fileExt}`
          const filePath = `documents/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('modules')
            .upload(filePath, fileDoc)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('modules')
            .getPublicUrl(filePath)

          uploadedFileUrl = publicUrl
          uploadedFileType = fileExt
        }
      }

      let activeModuleId = editingModuleId

      // PAYLOAD UTAMA UNTUK MODUL
      const modulePayload = {
        title: moduleTitle,
        content_text: contentType === 'text' ? moduleContent : '',
        audio_url: contentType === 'text' ? (audioUrl || null) : null,
        file_url: contentType === 'file' ? uploadedFileUrl : null,
        file_type: contentType === 'file' ? uploadedFileType : null
      }

      if (editingModuleId) {
        // [UPDATE ACTION] - Update Tabel Modules
        const { error: moduleUpdateError } = await supabase
          .from('modules')
          .update(modulePayload)
          .eq('id', editingModuleId)

        if (moduleUpdateError) throw moduleUpdateError
      } else {
        // [CREATE ACTION] - Insert Baru ke Tabel Modules
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert(modulePayload)
          .select()
          .single()

        if (moduleError) throw moduleError
        activeModuleId = moduleData.id
      }

      // PAYLOAD UTAMA UNTUK KUIS
      const quizPayload = {
        module_id: activeModuleId,
        title: quizTitle || `Kuis: ${moduleTitle}`,
        questions: questions 
      }

      if (editingQuizId) {
        // [UPDATE ACTION] - Update data kuis yang sudah ada sebelumnya
        const { error: quizUpdateError } = await supabase
          .from('quizzes')
          .update(quizPayload)
          .eq('id', editingQuizId)

        if (quizUpdateError) throw quizUpdateError
      } else {
        // [CREATE ACTION atau RE-INSERT] - Tambah kuis baru
        const { error: quizError } = await supabase
          .from('quizzes')
          .insert(quizPayload)

        if (quizError) throw quizError
      }

      setStatus({ 
        success: true, 
        msg: editingModuleId 
          ? 'Perubahan materi & paket kuis berhasil diperbarui!' 
          : 'Modul Pembelajaran & Paket Kuis baru berhasil diterbitkan ke sistem!' 
      })

      // Tunggu sebentar agar user melihat notifikasi sukses, lalu kembali ke list
      setTimeout(() => {
        fetchModules()
        resetFormToInitial()
      }, 1500)

    } catch (error: any) {
      console.error(error)
      setStatus({ success: false, msg: error.message || 'Gagal memproses operasi database.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-purple-600 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Tombol Navigasi Kembali / Atas List */}
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => {
              if (viewMode === 'form') {
                resetFormToInitial()
              } else {
                router.push('/super-admin')
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 
            {viewMode === 'form' ? 'Batalkan & Kembali ke List' : 'Kembali ke Panel Utama'}
          </button>

          {viewMode === 'list' && (
            <button
              onClick={() => {
                setStatus({})
                setViewMode('form')
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Modul Baru
            </button>
          )}
        </div>

        {/* Header Judul Halaman */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            CMS: Manajemen Modul & Kuis
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            {viewMode === 'list' 
              ? 'Kelola, perbarui, atau eliminasi seluruh pustaka materi microlearning yang telah mengudara di sistem.'
              : 'Formulir modifikasi satu pintu untuk mempublikasikan materi microlearning interaktif sekaligus paket evaluasi kuis.'
            }
          </p>
        </div>

        {/* CONTROLLER CONDITIONAL VIEW RENDERING */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            
            /* ========================================== */
            /* TAMPILAN VIEW READ (LIST ALL MODULES)      */
            /* ========================================== */
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {isFetching ? (
                <div className="w-full p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs font-bold">Sinkronisasi data database...</span>
                </div>
              ) : modulesList.length === 0 ? (
                <div className="w-full text-center p-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <ListFilter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">Belum ada modul yang terbit</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Klik tombol di kanan atas untuk menyusun modul perdana.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {modulesList.map((mod) => (
                    <div 
                      key={mod.id}
                      className="border border-slate-200/70 p-4 rounded-2xl bg-white flex items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {mod.file_url ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                              <FileText className="w-2.5 h-2.5" /> File {mod.file_type}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                              <BookOpen className="w-2.5 h-2.5" /> Teks & Audio
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 truncate pr-2">{mod.title}</h4>
                      </div>

                      {/* Aksi Manipulasi Data */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditClick(mod)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-600 flex items-center justify-center border border-slate-200/40 hover:border-purple-200 transition-all cursor-pointer"
                          title="Ubah Materi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(mod.id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center border border-slate-200/40 hover:border-red-200 transition-all cursor-pointer"
                          title="Hapus Materi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          ) : (
            
            /* ========================================== */
            /* TAMPILAN VIEW FORM (CREATE & UPDATE FORM)  */
            /* ========================================== */
            <motion.form 
              key="form-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit} 
              className="space-y-8"
            >
              {/* BAGIAN I: INPUT MODUL */}
              <div className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Bagian 1: Materi Microlearning {editingModuleId && '(Mode Ubah)'}
                    </h3>
                  </div>

                  {/* Selector Tipe Konten Baru (Teks vs File) */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">
                    <button
                      type="button"
                      disabled={editingModuleId !== null} // Kunci tipe konten jika sedang edit untuk menjaga integritas skema data
                      onClick={() => setContentType('text')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${
                        contentType === 'text' 
                          ? 'bg-white text-purple-600 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" /> Teks & Audio
                    </button>
                    <button
                      type="button"
                      disabled={editingModuleId !== null}
                      onClick={() => setContentType('file')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${
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
                  <div className="space-y-4">
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
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Unggah Dokumen Pembelajaran</label>
                    
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
                        required={contentType === 'file' && !existingFileUrl}
                      />
                      <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${
                        isDragActive ? 'text-purple-600 animate-bounce' : 'text-slate-400 group-hover:text-purple-500'
                      }`} />
                      
                      <span className="text-sm font-bold text-slate-700 block">
                        {fileDoc ? fileDoc.name : 'Pilih atau Jatuhkan berkas Word (.doc, .docx) atau PDF di sini'}
                      </span>
                      
                      {/* Informasi File Yang Ada di Database */}
                      {existingFileUrl && !fileDoc && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                          <Eye className="w-3 h-3" /> Berkas Terunggah Tersimpan (Jatuhkan file baru jika ingin mengganti)
                        </div>
                      )}

                      <span className="text-xs text-slate-400 block mt-1">
                        {fileDoc ? `Ukuran: ${(fileDoc.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimal ukuran file disarankan 10MB'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BAGIAN II: INPUT KUIS */}
              <div className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white space-y-5 shadow-xs">
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
                    <div 
                      key={qIndex}
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
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestionField}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-50/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Pertanyaan Baru
                </button>
              </div>

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
                  editingModuleId ? 'Perbarui Modul & Kuis' : 'Terbitkan Modul & Kuis Sekarang'
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

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