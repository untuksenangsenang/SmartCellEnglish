'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-green-600 px-6 py-4 text-white shadow-md">
        <h1 className="text-xl font-bold">SMART CELL ENGLISH — Anak Binaan</h1>
        <button 
          onClick={handleLogout}
          className="rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-600 transition"
        >
          Keluar (Logout)
        </button>
      </nav>

      {/* Main Content Placeholder */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back! 👋</h2>
          <p className="text-gray-600">Selamat datang di ruang belajar mandiri. Pilih menu di bawah untuk memulai aktivitas belajarmu hari ini.</p>
        </div>

        {/* Menu Grid Sesuai PRD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-800 mb-2">📚 Microlearning Modules</h3>
            <p className="text-sm text-gray-600 mb-4">Pelajari materi bahasa Inggris harian lengkap dengan audio native speaker.</p>
            <button 
  onClick={() => router.push('/user/modules')}
  className="text-sm font-semibold text-green-600 hover:underline transition"
>
  Buka Materi →
</button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🎙️ Podcast Recorder (.MP4)</h3>
            <p className="text-sm text-gray-600 mb-4">Sesi praktik berbicara. Rekam suaramu dan kirimkan langsung ke mentor.</p>
            <button className="text-sm font-semibold text-green-600 hover:underline">Mulai Rekaman →</button>
          </div>
        </div>
      </div>
    </div>
  )
}