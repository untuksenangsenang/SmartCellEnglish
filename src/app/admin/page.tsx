'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // State Data Pemantauan
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'kuis' | 'podcast'>('kuis')

// Ambil data gabungan dari database (Perbaikan Ambiguity Array 2)
  useEffect(() => {
    const fetchMonitorData = async () => {
      
      // 1. Gunakan nama constraint 'fk_quiz_attempts_profiles' dan 'fk_quiz_attempts_quizzes'
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_attempts')
        .select(`
          id, score, created_at,
          profiles!fk_quiz_attempts_profiles ( username ),
          quizzes!fk_quiz_attempts_quizzes ( title )
        `)
        .order('created_at', { ascending: false })

      // 2. Gunakan nama constraint 'fk_podcast_submissions_profiles'
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcast_submissions')
        .select(`
          id, audio_storage_url, created_at,
          profiles!fk_podcast_submissions_profiles ( username )
        `)
        .order('created_at', { ascending: false })

      // Logger untuk memantau jika ada kendala lain
      if (quizError) {
        console.error('❌ Detail Eror Query Kuis:', quizError.message)
      }
      if (podcastError) {
        console.error('❌ Detail Eror Query Podcast:', podcastError.message)
      }

      if (quizData) setQuizAttempts(quizData)
      if (podcastData) setPodcasts(podcastData)
      setIsLoading(false)
    }

    fetchMonitorData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Atas */}
      <nav className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white shadow-md">
        <h1 className="text-lg md:text-xl font-bold">SMART CELL ENGLISH — Panel Mentor LPKA</h1>
        <button 
          onClick={handleLogout}
          className="rounded bg-red-500 px-4 py-2 text-xs md:text-sm font-semibold hover:bg-red-600 transition shadow"
        >
          Keluar (Logout)
        </button>
      </nav>

      {/* Konten Utama */}
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-xl font-bold text-gray-800">Selamat Datang, Mentor! 👋</h2>
          <p className="text-sm text-gray-500 mt-1">Gunakan panel ini untuk memantau nilai kuis berkala dan mengevaluasi rekaman kemampuan berbicara Anak Binaan.</p>
        </div>

        {/* Tab Navigasi Internal */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('kuis')}
            className={`py-2.5 px-6 font-semibold text-sm border-b-2 transition ${activeTab === 'kuis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📊 Hasil Kuis Siswa ({quizAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab('podcast')}
            className={`py-2.5 px-6 font-semibold text-sm border-b-2 transition ${activeTab === 'podcast' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🎙️ Kiriman Audio Podcast ({podcasts.length})
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Sedang memuat rekapan data...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            
            {/* TAB I: TABEL NILAI KUIS */}
            {activeTab === 'kuis' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b text-gray-700 text-xs uppercase font-bold tracking-wider">
                      <th className="p-4">Nama Siswa</th>
                      <th className="p-4">Paket Kuis</th>
                      <th className="p-4">Tanggal Pengerjaan</th>
                      <th className="p-4 text-center">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-gray-600">
                    {quizAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-400">Belum ada siswa yang mengerjakan kuis.</td>
                      </tr>
                    ) : (
                      quizAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50/70 transition">
                          <td className="p-4 font-semibold text-gray-800">{attempt.profiles?.username || 'Anak Binaan'}</td>
                          <td className="p-4">{attempt.quizzes?.title || 'Kuis Umum'}</td>
                          <td className="p-4 text-xs text-gray-400">{new Date(attempt.created_at).toLocaleString('id-ID')}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${attempt.score >= 75 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {attempt.score} / 100
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB II: LIST KIRIMAN PODCAST AUDIO */}
            {activeTab === 'podcast' && (
              <div className="p-6 space-y-4">
                {podcasts.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">Belum ada kiriman rekaman audio dari siswa.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {podcasts.map((pod) => (
                      <div key={pod.id} className="p-4 border rounded-xl bg-gray-50 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800 text-base">👤 {pod.profiles?.username || 'Anak Binaan'}</h3>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Format .MP4</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Dikirim: {new Date(pod.created_at).toLocaleString('id-ID')}</p>
                        </div>

                        {/* Player Audio untuk Mendengarkan Langsung */}
                        <div className="bg-white p-2 rounded-lg border">
                          <audio src={pod.audio_storage_url} controls className="w-full h-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}