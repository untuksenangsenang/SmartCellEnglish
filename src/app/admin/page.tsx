'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, 
  LayoutDashboard, 
  BarChart3, 
  Mic, 
  Calendar, 
  Clock, 
  User, 
  Award,
  Music,
  Loader2,
  TrendingUp,
  Percent,
  FileAudio
} from 'lucide-react'

// Import komponen chart dari Recharts
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // State Data Pemantauan
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'kuis' | 'podcast'>('kuis')
  
  // State untuk menghindari error hidrasi SSR Recharts di Next.js
  const [mounted, setMounted] = useState(false)

  // Ambil data gabungan dari database
  useEffect(() => {
    const fetchMonitorData = async () => {
      setIsLoading(true)
      
      // 1. Ambil data kuis dengan constraint terkait
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_attempts')
        .select(`
          id, score, created_at,
          profiles!fk_quiz_attempts_profiles ( username ),
          quizzes!fk_quiz_attempts_quizzes ( title )
        `)
        .order('created_at', { ascending: false })

      // 2. Ambil data submission podcast
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcast_submissions')
        .select(`
          id, audio_storage_url, created_at,
          profiles!fk_podcast_submissions_profiles ( username )
        `)
        .order('created_at', { ascending: false })

      if (quizError) console.error('❌ Detail Eror Query Kuis:', quizError.message)
      if (podcastError) console.error('❌ Detail Eror Query Podcast:', podcastError.message)

      if (quizData) setQuizAttempts(quizData)
      if (podcastData) setPodcasts(podcastData)
      setIsLoading(false)
      setMounted(true)
    }

    fetchMonitorData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ==========================================
  // 📈 DATA PROCESSING UTILITIES FOR CHARTS
  // ==========================================

  // 1. Hitung Ringkasan Metrik Singkat (Statistik Atas)
  const totalQuizAttempts = quizAttempts.length
  const totalPodcastSubmissions = podcasts.length
  const averageQuizScore = totalQuizAttempts > 0 
    ? Math.round(quizAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalQuizAttempts) 
    : 0

  // 2. Olah Data Grafik: Rata-rata Skor per Modul Kuis (Bar Chart)
  const getQuizPerformanceData = () => {
    const grouped = quizAttempts.reduce((acc: any, curr) => {
      const title = curr.quizzes?.title || 'Kuis Umum'
      if (!acc[title]) {
        acc[title] = { name: title, totalScore: 0, count: 0 }
      }
      acc[title].totalScore += curr.score || 0
      acc[title].count += 1
      return acc;
    }, {})

    return Object.values(grouped).map((item: any) => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      'Rata-rata Nilai': Math.round(item.totalScore / item.count),
      'Total Peserta': item.count
    }))
  }

  // 3. Olah Data Grafik: Aktivitas Harian Kuis vs Podcast (Area Chart - Last 7 Days)
  const getActivityTimelineData = () => {
    const timelineMap: any = {}

    // Helper untuk format tanggal readable singkat (contoh: "24 Jun")
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }

    // Masukkan data kuis ke linimasa
    quizAttempts.forEach(q => {
      const dateKey = formatDate(q.created_at)
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, 'Pengerjaan Kuis': 0, 'Setor Podcast': 0 }
      timelineMap[dateKey]['Pengerjaan Kuis'] += 1
    })

    // Masukkan data podcast ke linimasa
    podcasts.forEach(p => {
      const dateKey = formatDate(p.created_at)
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, 'Pengerjaan Kuis': 0, 'Setor Podcast': 0 }
      timelineMap[dateKey]['Setor Podcast'] += 1
    })

    // Urutkan dan ambil maksimal 7 data hari terakhir aktivitas berjalan
    return Object.values(timelineMap).slice(-7)
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-0 selection:bg-purple-600 selection:text-white">

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-24">
        
        {/* Welcome Card Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-purple-600" />
              Selamat Datang, Mentor
            </h2>
            <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-2xl">
              Gunakan pusat pemantauan ini untuk meninjau pencapaian nilai berkala, memvalidasi pemahaman materi, serta mengevaluasi rekaman kompetensi berbicara (*speaking skill*) Anak Binaan.
            </p>
          </div>
        </motion.div>

        {/* 📊 NEW ANALYTICS SECTION: STAT CARDS (Hanya Muncul Jika Loading Selesai) */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Log Kuis</p>
                <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalQuizAttempts} <span className="text-xs font-medium text-slate-400">Pengerjaan</span></h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Rata-rata Nilai</p>
                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  {averageQuizScore} <span className="text-xs font-medium text-slate-400">/ 100</span>
                </h3>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Arsip Podcast</p>
                <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalPodcastSubmissions} <span className="text-xs font-medium text-slate-400">Audio (.mp4)</span></h3>
              </div>
            </div>
          </div>
        )}

        {/* 📊 NEW ANALYTICS SECTION: DATA CHARTS & GRAPHICS */}
        {!isLoading && mounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Grafik I: Performa Nilai Modul Kuis */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-2xs">
              <div>
                <h3 className="text-xs font-black text-slate-950 tracking-tight uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-purple-600 rounded-xs inline-block" />
                  Rata-rata Skor per Modul Pembelajaran
                </h3>
                <p className="text-[11px] font-medium text-slate-400">Evaluasi efektivitas penyerapan pemahaman kuis siswa</p>
              </div>
              <div className="w-full h-64 text-[11px]">
                {getQuizPerformanceData().length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium border border-dashed border-slate-100 rounded-xl">Belum ada aktivitas grafik</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getQuizPerformanceData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="Rata-rata Nilai" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Grafik II: Garis Tren Aktivitas Harian */}
            <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-2xs">
              <div>
                <h3 className="text-xs font-black text-slate-950 tracking-tight uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-xs inline-block" />
                  Tren Aktivitas Belajar (7 Hari Terakhir)
                </h3>
                <p className="text-[11px] font-medium text-slate-400">Frekuensi interaksi siswa mengumpulkan tugas harian</p>
              </div>
              <div className="w-full h-64 text-[11px]">
                {getActivityTimelineData().length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium border border-dashed border-slate-100 rounded-xl">Belum ada lini masa aktivitas</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getActivityTimelineData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorKuis" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPodcast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="Pengerjaan Kuis" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorKuis)" />
                      <Area type="monotone" dataKey="Setor Podcast" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPodcast)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 3. CONTROLS & NAVIGATION TABS */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200/60 items-center justify-start gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('kuis')}
              className={`relative py-3 px-4 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'kuis' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Hasil Kuis Siswa ({quizAttempts.length})
              </span>
              {activeTab === 'kuis' && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('podcast')}
              className={`relative py-3 px-4 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'podcast' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Arsip Audio Podcast ({podcasts.length})
              </span>
              {activeTab === 'podcast' && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                />
              )}
            </button>
          </div>

          {/* 4. DATA PRESENTATION PANEL */}
          {isLoading ? (
            <div className="p-16 border border-slate-200/60 rounded-2xl text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2 bg-white">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Sedang mensinkronisasi data pangkalan...
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <AnimatePresence mode="wait">
                
                {/* TAB I: TABEL NILAI KUIS */}
                {activeTab === 'kuis' && (
                  <motion.div
                    key="kuis-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-x-auto"
                  >
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                          <th className="p-4 pl-6">Anak Binaan</th>
                          <th className="p-4">Modul / Paket Kuis</th>
                          <th className="p-4"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Waktu Penyelesaian</span></th>
                          <th className="p-4 text-center w-36"><span className="flex items-center justify-center gap-1"><Award className="w-3.5 h-3.5" /> Skor Perolehan</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {quizAttempts.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                              Belum ada rekaman riwayat pengerjaan kuis dari siswa.
                            </td>
                          </tr>
                        ) : (
                          quizAttempts.map((attempt) => (
                            <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-4 pl-6 font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                  <User className="w-3 h-3" />
                                </div>
                                {attempt.profiles?.username || 'Anak Binaan'}
                              </td>
                              <td className="p-4 text-slate-700 font-semibold">{attempt.quizzes?.title || 'Kuis Umum'}</td>
                              <td className="p-4 text-slate-400 font-normal">
                                {new Date(attempt.created_at).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs tracking-wide inline-block ${
                                  attempt.score >= 75 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                }`}>
                                  {attempt.score} / 100
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </motion.div>
                )}

                {/* TAB II: LIST KIRIMAN PODCAST AUDIO */}
                {activeTab === 'podcast' && (
                  <motion.div
                    key="podcast-tab"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="p-5 md:p-6"
                  >
                    {podcasts.length === 0 ? (
                      <p className="text-center text-slate-400 text-xs py-12 font-medium">
                        Belum ada kiriman file rekaman audio dari siswa.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {podcasts.map((pod) => (
                          <div 
                            key={pod.id} 
                            className="p-4 border border-slate-200/80 rounded-2xl bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-4 shadow-2xs"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Music className="w-3 h-3" />
                                  </div>
                                  {pod.profiles?.username || 'Anak Binaan'}
                                </h3>
                                <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  audio / mp4
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(pod.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                              </div>
                            </div>

                            {/* Custom Stream Audio Player Minimalis */}
                            <div className="bg-slate-50 border border-slate-200/60 p-2 rounded-xl flex items-center gap-2">
                              <audio 
                                src={pod.audio_storage_url} 
                                controls 
                                className="w-full h-7 text-xs bg-transparent accent-purple-600 outline-none focus:outline-none [&::-webkit-media-controls-panel]:bg-slate-50" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}