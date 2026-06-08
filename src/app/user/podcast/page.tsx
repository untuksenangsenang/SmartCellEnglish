'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ArrowLeft, Mic, Square, Radio, Play, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react'

export default function PodcastPage() {
  const router = useRouter()
  const supabase = createClient()

  // State Management Perekaman
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [recordingTime, setRecordingTime] = useState(0)

  // State Management Pengunggahan
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; msg?: string }>({})

  // Reference untuk Web API Browser
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Efek samping untuk mengatur hitungan timer detik perekaman
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  // 1. Fungsi Memulai Perekaman Audio
  const startRecording = async () => {
    setAudioBlob(null)
    setAudioUrl('')
    setRecordingTime(0)
    setUploadStatus({})
    audioChunksRef.current = []

    try {
      // Meminta izin mikrofon komputer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const options = MediaRecorder.isTypeSupported('audio/mp4') 
        ? { mimeType: 'audio/mp4' } 
        : undefined

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp4' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        
        // Matikan fungsi hardware mikrofon setelah selesai digunakan
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Gagal mengakses mikrofon:', err)
      setUploadStatus({ 
        success: false, 
        msg: 'Gagal mengakses mikrofon. Pastikan izin perangkat sudah diaktifkan.' 
      })
    }
  }

  // 2. Fungsi Menghentikan Perekaman
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // 3. Fungsi Mengunggah File ke Supabase Storage & Database
  const uploadPodcast = async () => {
    if (!audioBlob) return
    setIsUploading(true)
    setUploadStatus({})

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')

      const fileName = `${user.id}/${Date.now()}-podcast.mp4`
      const fileToUpload = new File([audioBlob], 'podcast.mp4', { type: 'audio/mp4' })

      // A. Aksi unggah ke Supabase Storage Bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('podcast-bucket')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) throw storageError

      // B. Dapatkan tautan URL Publik dari file yang baru saja diunggah
      const { data: { publicUrl } } = supabase.storage
        .from('podcast-bucket')
        .getPublicUrl(fileName)

      // C. Catat tautan URL publik tersebut ke tabel podcast_submissions
      const { error: dbError } = await supabase
        .from('podcast_submissions')
        .insert({
          user_id: user.id,
          audio_storage_url: publicUrl
        })

      if (dbError) throw dbError

      setUploadStatus({ success: true, msg: 'Siniar (Podcast) berhasil dikirimkan ke Mentor!' })
      setAudioBlob(null)
    } catch (error: any) {
      console.error(error)
      setUploadStatus({ success: false, msg: error.message || 'Gagal mengirim berkas rekaman.' })
    } finally {
      setIsUploading(false)
    }
  }

  // Format angka timer menit:detik (contoh: 02:05)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Definisi Tipe Varian Animasi Aman TypeScript (Eror TS2322 Prevented)
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  }

  return (
    // Background murni putih (bg-white) sesuai arahan arsitektur UI baru
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white text-slate-800 p-4 md:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-xl mx-auto space-y-6 pb-16">
        
        {/* Tombol Navigasi Kembali */}
        <div>
          <button 
            onClick={() => router.push('/user')}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Dashboard
          </button>
        </div>

        {/* Kontainer Konten Utama */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={cardVariants}
          className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-6"
        >
          {/* Header */}
          <div className="space-y-1.5 border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-emerald-600 shrink-0 animate-pulse" />
              Sesi Praktik Rekaman Siniar
            </h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Gunakan fitur ini untuk melatih kelancaran berbicara dalam Bahasa Inggris (*speaking fluency*). Berkas rekaman suara kamu akan langsung dikirim ke panel pemantauan Mentor untuk dievaluasi.
            </p>
          </div>

          {/* Kotak Visual Indikator Kondisi Perekam Audio */}
          <div className="flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-8 text-white relative overflow-hidden border border-slate-900 shadow-inner">
            {isRecording && (
              <div className="absolute inset-0 bg-radial from-red-600/10 via-transparent to-transparent animate-pulse pointer-events-none" />
            )}
            
            {/* Animasi Ring Mikrofon */}
            <div className="relative mb-4">
              {isRecording && (
                <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-500/20 animate-ping" />
              )}
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 shadow-lg shadow-red-600/30' : 'bg-slate-800 border border-slate-700'}`}>
                <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-slate-300'}`} />
              </div>
            </div>
            
            <span className="text-4xl font-mono font-black tracking-wider mb-1.5 text-white">
              {formatTime(recordingTime)}
            </span>
            <span className={`text-xs font-bold uppercase tracking-widest ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              {isRecording ? 'LIVE • Recording Audio...' : 'Perekam Siap Digunakan'}
            </span>
          </div>

          {/* Tombol Kontrol Perekaman */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/10'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  Hentikan Rekaman
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  {audioUrl ? 'Rekam Ulang Suara' : 'Mulai Rekam Suara'}
                </>
              )}
            </button>
          </div>

          {/* Area Review Jalur Audio Sebelum Dikirim (AnimatePresence untuk Transisi Mulus) */}
          <AnimatePresence>
            {audioUrl && !isRecording && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/60 space-y-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" /> 
                  Dengarkan Hasil Rekamanmu:
                </div>
                
                <audio src={audioUrl} controls className="w-full accent-emerald-600 h-10" />
                
                <button
                  type="button"
                  onClick={uploadPodcast}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-950/10 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sedang Mengirim ke Server...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Rekaman ke Mentor
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifikasi Status Aksi Penyerahan Berkas Siniar */}
          <AnimatePresence>
            {uploadStatus.msg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={`p-4 rounded-xl text-sm font-semibold border flex items-start gap-2.5 ${
                  uploadStatus.success 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}
              >
                {uploadStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{uploadStatus.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}