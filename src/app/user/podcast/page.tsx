'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

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
    audioChunksRef.current = [];

    try {
      // Meminta izin mikrofon komputer LPKA
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Catatan: Beberapa browser (seperti Chrome) tidak mendukung tipe 'audio/mp4' secara bawaan.
      // Kita akan menangkap data mentah (audio/webm atau video/mp4 audio-only) lalu membungkusnya sebagai file .mp4 saat upload.
      const options = MediaRecorder.isTypeSupported('audio/mp4') 
        ? { mimeType: 'audio/mp4' } 
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Gabungkan seluruh potongan audio menjadi satu Blob berkontainer mp4
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
      setUploadStatus({ success: false, msg: 'Gagal mengakses mikrofon. Pastikan izin perangkat sudah diizinkan.' })
    }
  }

  // 2. Fungsi Menghentikan Perekaman
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // 3. Fungsi Mengunggah File ke Supabase
  const uploadPodcast = async () => {
    if (!audioBlob) return
    setIsUploading(true)
    setUploadStatus({})

    try {
      // Ambil session user aktif untuk mendapatkan ID User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')

      // Buat nama file unik: folder_id_user/timestamp.mp4
      const fileName = `${user.id}/${Date.now()}-podcast.mp4`
      
      // Bungkus objek blob menjadi File siap kirim
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <button 
          onClick={() => router.push('/user')}
          className="mb-4 text-sm text-green-600 hover:underline font-semibold"
        >
          ← Kembali ke Dashboard
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎙️ Sesi Praktik Rekaman Siniar (Podcast)</h2>
        <p className="text-sm text-gray-500 mb-6">
          Gunakan fitur ini untuk melatih kelancaran berbicara dalam Bahasa Inggris. Rekaman kamu akan langsung dikirim ke panel pemantauan Mentor untuk dinilai.
        </p>

        {/* Kotak Visual Indikator Perekam */}
        <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl p-8 text-white mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}>
            <span className="text-2xl">🎙️</span>
          </div>
          
          <span className="text-3xl font-mono font-bold tracking-wider mb-2">
            {formatTime(recordingTime)}
          </span>
          <span className="text-xs text-gray-400">
            {isRecording ? 'Sedang Merekam Suara...' : 'Perekam Siap Digunakan'}
          </span>
        </div>

        {/* Tombol Kontrol Perekaman */}
        <div className="flex gap-4 justify-center mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isUploading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow transition disabled:bg-gray-400"
            >
              {audioUrl ? 'Rekam Ulang' : 'Mulai Rekam Suara'}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow transition"
            >
              Hentikan Rekaman
            </button>
          )}
        </div>

        {/* Area Review Audio sebelum dikirim */}
        {audioUrl && !isRecording && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2">Dengarkan Hasil Rekamanmu:</p>
            <audio src={audioUrl} controls className="w-full mb-4" />
            
            <button
              onClick={uploadPodcast}
              disabled={isUploading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow transition disabled:bg-gray-400"
            >
              {isUploading ? 'Sedang Mengirim ke Server...' : '🚀 Kirim Rekaman ke Mentor'}
            </button>
          </div>
        )}

        {/* Notifikasi Status Aksi */}
        {uploadStatus.msg && (
          <div className={`p-4 rounded-lg text-sm text-center font-medium ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {uploadStatus.success ? '✅ ' : '⚠️ '} {uploadStatus.msg}
          </div>
        )}
      </div>
    </div>
  )
}