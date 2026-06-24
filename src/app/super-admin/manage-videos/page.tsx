'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Video, Plus, Trash2, Loader2, ArrowLeft, Link2, FileText, Heading } from 'lucide-react'

interface VideoData {
  id: string
  title: string
  description: string | null
  youtube_id: string
  created_at: string
}

export default function ManageVideosPage() {
  const router = useRouter()
  const supabase = createClient()

  // State Input Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  
  // State Data & Loading
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State Notifikasi
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Ambil daftar video dari Supabase
  const fetchVideos = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal memuat daftar video dari server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fungsi otomatis mengekstrak ID unik YouTube dari berbagai format URL
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // Fungsi submit data video baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsSubmitting(true)

    const youtubeId = extractYoutubeId(youtubeUrl)
    if (!youtubeId) {
      setErrorMsg('Format URL YouTube tidak valid! Pastikan menyalin tautan video dengan benar.')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from('videos')
        .insert([
          {
            title,
            description: description || null,
            youtube_id: youtubeId,
          },
        ])

      if (error) throw error

      setSuccessMsg('Video pembelajaran baru berhasil di-upload!')
      setTitle('')
      setDescription('')
      setYoutubeUrl('')
      fetchVideos() 
    } catch (err) {
      console.error(err)
      setErrorMsg('Terjadi kesalahan saat menyimpan data ke database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fungsi menghapus video
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus video pembelajaran ini?')) return

    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccessMsg('Video berhasil dihapus dari ruang belajar.')
      fetchVideos()
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal menghapus video. Silakan coba lagi.')
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        <button 
          type="button"
          onClick={() => router.push('/super-admin')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Panel Utama
        </button>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Video className="w-6 h-6 text-red-600" />
            Manajemen Video Pembelajaran
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Unggah, pantau, dan kelola tautan video edukasi dari YouTube Smart Cell English.
          </p>
        </div>

        {errorMsg && <div className="p-4 text-xs font-bold bg-red-50 border border-red-200 text-red-600 rounded-xl">⚠️ {errorMsg}</div>}
        {successMsg && <div className="p-4 text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">🎉 {successMsg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* FORM INPUT */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-emerald-600" /> Tambah Video Baru
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="video-title" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Heading className="w-3 h-3 text-slate-400" /> Judul Video
                </label>
                <input 
                  id="video-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Belajar Kosakata Harian Bagian 1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="video-url" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-slate-400" /> Link / URL YouTube
                </label>
                <input 
                  id="video-url"
                  type="text"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste link video lengkap dari YouTube di sini"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="video-desc" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" /> Deskripsi Materi (Opsional)
                </label>
                <textarea 
                  id="video-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan catatan pengerjaan atau ringkasan isi video..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Rilis Video Materi</>
                )}
              </button>
            </form>
          </div>

          {/* DAFTAR VIDEO */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Koleksi Video Aktif ({videos.length})</h3>

            {isLoading ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-100 rounded-2xl bg-slate-50/40">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-bold">Sinkronisasi data video...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="w-full text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-slate-700">Belum ada video pembelajaran</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    className="bg-white border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xs group hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img 
                          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-md uppercase">
                          YouTube
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{video.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{video.description || 'Tidak ada deskripsi tambahan.'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(video.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(video.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}