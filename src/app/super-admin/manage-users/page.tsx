'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // ✅ Gunakan client lokal proyekmu

export default function ManageUsersPage() {
  const router = useRouter()
  const supabase = createClient() // ✅ Inisialisasi ulang dengan benar
  
  // State List Data Pengguna
  const [users, setUsers] = useState<any[]>([])
  const [isFetchLoading, setIsFetchLoading] = useState(true)

  // State Form Tunggal
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')

  // State File CSV
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // State Status & Loading global untuk aksi tombol
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; msg?: string; details?: any[] }>({})

  // State untuk Fitur Edit (Modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; role: string } | null>(null)

  // 1. Fungsi Ambil Data dari Tabel Profiles
  const fetchAllProfiles = async () => {
    setIsFetchLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, created_at')
      .order('username', { ascending: true })

    if (!error && data) {
      setUsers(data)
    }
    setIsFetchLoading(false)
  }

  useEffect(() => {
    fetchAllProfiles()
  }, [])

  // 2. Handler Register Akun Tunggal
  const handleRegisterSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({})

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, role })
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan.')
      
      setStatus({ success: true, msg: result.message })
      setUsername('')
      setEmail('')
      setPassword('')
      setRole('user')
      fetchAllProfiles() // Segarkan isi tabel data
    } catch (error: any) {
      setStatus({ success: false, msg: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Handler Bulk Import CSV
  const handleBulkImportCSV = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return alert('Silakan pilih file CSV terlebih dahulu!')

    setIsLoading(true)
    setStatus({})

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split(/\r?\n/)
      if (lines.length <= 1) {
        setIsLoading(false)
        return setStatus({ success: false, msg: 'File CSV kosong.' })
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const parsedUsers: any[] = []

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const currentLine = lines[i].includes(';') ? lines[i].split(';') : lines[i].split(',')
        if (currentLine.length < headers.length) continue

        const userObj: any = {}
        headers.forEach((header, index) => {
          userObj[header] = currentLine[index]?.trim()
        })
        parsedUsers.push(userObj)
      }

      try {
        const response = await fetch('/api/admin/bulk-create-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: parsedUsers })
        })
        const result = await response.json()

        if (!response.ok) throw new Error(result.error || 'Gagal memproses bulk import.')

        setStatus({ success: true, msg: result.message, details: result.summary?.failedDetails || [] })
        setCsvFile(null)
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchAllProfiles() // Segarkan isi tabel data
      } catch (error: any) {
        setStatus({ success: false, msg: error.message })
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsText(csvFile)
  }

  // 4. Handler Hapus Pengguna (Delete)
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${name}" secara permanen dari sistem?`)) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Gagal menghapus user.')
      
      alert(result.message)
      fetchAllProfiles() // Segarkan tabel data
    } catch (error: any) {
      alert(`Gagal: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 5. Handler Simpan Perubahan Edit (Update)
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          username: editingUser.username,
          role: editingUser.role
        })
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Gagal memperbarui data.')

      setIsEditModalOpen(false)
      setEditingUser(null)
      fetchAllProfiles() // Segarkan tabel data
      alert('Sukses: Data pengguna berhasil diperbarui.')
    } catch (error: any) {
      alert(`Gagal Update: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto mt-4">
        <button 
          onClick={() => router.push('/super-admin')}
          className="mb-4 text-sm text-purple-700 hover:underline font-semibold inline-block"
        >
          ← Kembali ke Panel Utama
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">👥 Manajemen Kontrol Akun Pengguna</h1>

        {/* Notifikasi Global */}
        {status.msg && (
          <div className={`mb-6 p-4 rounded-xl border text-sm ${status.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="font-bold">{status.success ? '✅ Berhasil' : '⚠️ Masalah Ditemukan'}</p>
            <p className="mt-0.5">{status.msg}</p>
            {status.details && status.details.length > 0 && (
              <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-700 space-y-1">
                <p className="font-semibold">Daftar gagal impor:</p>
                {status.details.map((f, idx) => (
                  <li key={idx}>{f.email} — <span className="italic">Sebab: {f.reason}</span></li>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* FORM INPUT TUNGGAL */}
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="text-base font-bold text-gray-800 mb-1">Registrasi Akun Tunggal</h2>
            <p className="text-xs text-gray-400 mb-4">Tambahkan satu akun secara instan.</p>
            <form onSubmit={handleRegisterSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Username / Nama</label>
                <input
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none" required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none" required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none" minLength={6} required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Role Hak Akses</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 bg-white focus:outline-none"
                >
                  <option value="user">Anak Binaan (Role: User)</option>
                  <option value="admin">Mentor / Staf LPKA (Role: Admin)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-sm transition disabled:bg-gray-400"
              >
                {isLoading ? 'Memproses...' : 'Daftarkan Akun'}
              </button>
            </form>
          </div>

          {/* BULK IMPORT CSV */}
          <div className="bg-white rounded-xl shadow-sm p-6 border flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Bulk Import via File CSV</h2>
              <p className="text-xs text-gray-400 mb-4">Unggah puluhan data pengguna sekaligus.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1 mb-6">
                <p className="font-bold">⚠️ Aturan Header CSV:</p>
                <code className="block bg-amber-100 p-1.5 rounded font-mono text-[11px] text-amber-900">username,email,password,role</code>
                <p className="text-[10px] mt-1 text-amber-600">*Isian role wajib: <span className="font-mono">user</span>, <span className="font-mono">admin</span>, atau <span className="font-mono">super_admin</span>.</p>
              </div>
              <form onSubmit={handleBulkImportCSV} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pilih Berkas (.csv)</label>
                  <input
                    id="csv-file-input" type="file" accept=".csv"
                    onChange={(e) => e.target.files && setCsvFile(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    required
                  />
                </div>
                <button
                  type="submit" disabled={isLoading || !csvFile}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition disabled:bg-gray-300"
                >
                  {isLoading ? 'Sedang Memproses Massal...' : '🚀 Unggah & Proses Massal'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 🔥 PANEL BARU: TABEL AKUN AKTIF YANG TERDAFTAR */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b bg-gray-50/70">
            <h2 className="text-base font-bold text-gray-800">📋 Daftar Akun Aktif Terdaftar ({users.length})</h2>
            <p className="text-xs text-gray-400 mt-0.5">Berikut adalah seluruh akun terverifikasi yang memiliki akses ke database SMART CELL.</p>
          </div>

          {isFetchLoading ? (
            <div className="p-10 text-center text-sm text-gray-400">Memuat pangkalan data pengguna...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">Belum ada akun yang terdaftar dalam database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100/70 text-gray-600 text-xs font-bold uppercase border-b">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Nama Lengkap / Username</th>
                    <th className="p-4 w-48">Hak Akses (Role)</th>
                    <th className="p-4 w-40 text-center">Aksi Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 text-center font-medium text-gray-400">{index + 1}</td>
                      <td className="p-4 font-semibold text-gray-900">{user.username}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.role === 'super_admin' ? 'bg-red-50 text-red-700 border border-red-200' :
                          user.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {user.role === 'super_admin' ? '👑 Super Admin' : 
                           user.role === 'admin' ? '👨‍🏫 Mentor (Admin)' : '🧒 Anak Binaan'}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser({ id: user.id, username: user.username, role: user.role })
                            setIsEditModalOpen(true)
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 border hover:bg-gray-200 text-xs font-bold rounded transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold rounded transition disabled:bg-gray-200"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🛠️ MODAL OVERLAY POP-UP UNTUK EDIT DATA USER */}
      {/* ========================================================= */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-800 mb-1">📝 Ubah Data Pengguna</h3>
            <p className="text-xs text-gray-400 mb-4">Lakukan perubahan data profil internal.</p>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Username Baru</label>
                <input
                  type="text" value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none" required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase">Ubah Tingkat Akses (Role)</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="mt-1 w-full rounded-md border p-2 text-sm text-gray-900 focus:border-purple-500 bg-white focus:outline-none"
                >
                  <option value="user">Anak Binaan (Role: User)</option>
                  <option value="admin">Mentor / Staf LPKA (Role: Admin)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingUser(null)
                  }}
                  className="w-1/2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={isLoading}
                  className="w-1/2 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold transition disabled:bg-gray-400"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}