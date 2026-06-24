'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Video, Play, Loader2, Clock } from 'lucide-react'

interface VideoData {
  id: string
  title: string
  description: string | null
  youtube_id: string
  created_at: string
}

export default function VideoLearningPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setVideos(data || [])
        
        if (data && data.length > 0) {
          setActiveVideo(data[0])
        }
      } catch (err) {
        console.error('Gagal mengambil data video:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [supabase])

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-amber-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        <button 
          type="button"
          onClick={() => router.push('/user')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-200/60 hover:border-amber-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
        </button>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-500" />
            Video Learning Space
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            Tonton materi video interaktif pilihan langsung dari channel resmi Smart Cell English.
          </p>
        </div>

        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-xs font-bold">Membuka pustaka video pembelajaran...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="w-full text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Belum ada video yang diunggah</h4>
            <p className="text-xs text-slate-400 mt-0.5">Mentor belum merilis video materi untuk saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* MAIN PLAYER BOX */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {activeVideo && (
                  <motion.div
                    key={activeVideo.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-4"
                  >
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-slate-200/60">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?rel=0&autoplay=0`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div className="space-y-2 p-1">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">{activeVideo.title}</h3>
                      <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        Dirilis pada {new Date(activeVideo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {activeVideo.description && (
                        <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                          {activeVideo.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SIDEBAR PLAYLIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Daftar Materi ({videos.length})</h4>
              
              <div className="space-y-2 max-h-[60vh] lg:max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin">
                {videos.map((video) => {
                  const isActive = activeVideo?.id === video.id
                  return (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-amber-50/60 border-amber-200 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-800'
                      }`}
                    >
                      <div className="relative w-24 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/40">
                        <img 
                          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 ${isActive ? 'bg-amber-950/30' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <Play className={`w-4 h-4 text-white fill-white ${isActive && 'animate-pulse'}`} />
                        </div>
                      </div>

                      <div className="min-w-0 flex flex-col justify-center">
                        <h5 className={`text-xs font-bold leading-snug line-clamp-2 ${isActive ? 'text-amber-950' : 'text-slate-900 group-hover:text-amber-600'} transition-colors`}>
                          {video.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">Smart Cell English</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}