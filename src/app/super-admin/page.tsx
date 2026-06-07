'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SuperAdminDashboard() {
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
      <nav className="flex items-center justify-between bg-purple-700 px-6 py-4 text-white shadow-md">
        <h1 className="text-xl font-bold">SMART CELL ENGLISH — Super Admin Panel</h1>
        <button 
          onClick={handleLogout}
          className="rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-600 transition"
        >
          Keluar (Logout)
        </button>
      </nav>

      {/* Main Content Placeholder */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sistem Kontrol Utama Utama 🛠️</h2>
          <p className="text-gray-600">Hak akses penuh developer untuk manajemen akun mentor, bulk import data siswa, dan manajemen CMS konten materi.</p>
        </div>

        {/* Grid Fitur Utama Super Admin sesuai FR-SA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-1">👥 Account Management</h3>
            <p className="text-xs text-gray-500 mb-4">Tambah atau nonaktifkan akun level Mentor/Admin LPKA.</p>
            <button className="w-full py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-semibold hover:bg-purple-200">Kelola Mentor</button>
          </div>
          
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-1">📥 Bulk Import CSV</h3>
            <p className="text-xs text-gray-500 mb-4">Unggah data 30 Anak Binaan sekaligus via file Excel/CSV ke database.</p>
            <button className="w-full py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-semibold hover:bg-purple-200">Upload CSV</button>
          </div>

          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-1">📝 CMS Konten Materi</h3>
            <p className="text-xs text-gray-500 mb-4">CRUD data Modul Pembelajaran microlearning beserta paket soal Kuis.</p>
            <button 
  onClick={() => router.push('/super-admin/manage-materi')}
  className="w-full py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-semibold hover:bg-purple-200 transition"
>
  Kelola Materi & Kuis
</button>
          </div>

          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Kelola Pengguna</h3>
            <p className="text-xs text-gray-500 mb-4">Membuat User untuk binaan</p>
            <button 
  onClick={() => router.push('/super-admin/manage-users')}
  className="w-full py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-semibold hover:bg-blue-200 transition"
>
  Kelola Pengguna (Tambah Akun Baru)
</button>
          </div>
        </div>
      </div>
    </div>
  )
}