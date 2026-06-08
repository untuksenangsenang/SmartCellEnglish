'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  UploadCloud, 
  FileSpreadsheet, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react'

export default function ManageUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  
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

// 1. Fungsi Ambil Data dari API Route Admin (Bypass RLS secara aman)
const fetchAllProfiles = async () => {
  setIsFetchLoading(true)
  try {
    const response = await fetch('/api/admin/get-users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()

    if (!response.ok) throw new Error(result.error || 'Gagal mengambil data.')

    if (result.data) {
      setUsers(result.data)
    }
  } catch (error: any) {
    console.error('Fetch Error:', error.message)
    // Anda bisa memunculkan status error ke UI jika diperlukan
    setStatus({ success: false, msg: `Gagal memuat data: ${error.message}` })
  } finally {
    setIsFetchLoading(false)
  }
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
      fetchAllProfiles()
    } catch (error: any) {
      setStatus({ success: false, msg: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Handler Bulk Import CSV
  const handleBulkImportCSV = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return

    setIsLoading(true)
    setStatus({})

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split(/\r?\n/)
      if (lines.length <= 1) {
        setIsLoading(false)
        return setStatus({ success: false, msg: 'Berkas CSV terdeteksi kosong.' })
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
        fetchAllProfiles()
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
      fetchAllProfiles()
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
      fetchAllProfiles()
      alert('Sukses: Data otoritas pengguna berhasil diperbarui.')
    } catch (error: any) {
      alert(`Gagal Update: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 p-4 md:p-8 selection:bg-purple-600 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Tombol Kembali */}
        <button 
          onClick={() => router.push('/super-admin')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Panel Utama
        </button>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Manajemen Kontrol Akun Pengguna
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
            Kelola otoritas masuk, registrasi accounts baru, atau lakukan import database berskala besar.
          </p>
        </div>

        {/* Global Alert Notification */}
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border text-sm flex flex-col gap-1 ${
              status.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {status.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              {status.success ? 'Berhasil Diarsip' : 'Masalah Operasional Ditemukan'}
            </div>
            <p className="text-xs ml-6 font-medium text-slate-600/90">{status.msg}</p>
            
            {status.details && status.details.length > 0 && (
              <div className="mt-2 ml-6 pt-2 border-t border-rose-200/60 text-xs text-rose-700 space-y-1">
                <p className="font-bold">Gagal Diimpor ({status.details.length} entri):</p>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  {status.details.map((f, idx) => (
                    <li key={idx}>{f.email} — <span className="italic text-rose-600 font-normal">Sebab: {f.reason}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* CARD 1: FORM REGISTRASI TUNGGAL */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Registrasi Akun Tunggal</h2>
                  <p className="text-[10px] font-medium text-slate-400">Tambahkan satu user kredensial baru secara instan</p>
                </div>
              </div>

              <form onSubmit={handleRegisterSingle} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Username / Nama Lengkap</label>
                  <input
                    type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all" required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Alamat Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all" required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Kata Sandi (Password)</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all" minLength={6} required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Tingkatan Hak Akses (Role)</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 bg-slate-50 focus:border-purple-500 focus:outline-none cursor-pointer font-semibold transition-all"
                  >
                    <option value="user">Anak Binaan (Role: User)</option>
                    <option value="admin">Mentor / Staf LPKA (Role: Admin)</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={isLoading}
                  className="w-full mt-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Daftarkan Akun'}
                </button>
              </form>
            </div>
          </motion.div>

          {/* CARD 2: BULK IMPORT FILE CSV */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-slate-200/80 rounded-2xl p-5 sm:p-6 bg-white flex flex-col justify-between shadow-xs"
          >
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Bulk Import via CSV</h2>
                  <p className="text-[10px] font-medium text-slate-400">Unggah puluhan data akun murid sekaligus</p>
                </div>
              </div>

              <div className="border border-amber-200/70 rounded-xl p-3 bg-amber-50/40 text-xs text-amber-900 space-y-1 mb-4">
                <p className="font-bold inline-flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Aturan Header Kolom CSV:
                </p>
                <code className="block bg-white border border-amber-200/80 p-1.5 rounded-lg font-mono text-[10px] text-amber-950 font-bold select-all">
                  username,email,password,role
                </code>
                <p className="text-[10px] text-amber-700 pt-0.5 leading-relaxed">
                  *Isian parameter kolom role yang sah hanya: <span className="underline font-bold">user</span>, <span className="underline font-bold">admin</span>, atau <span className="underline font-bold">super_admin</span>.
                </p>
              </div>

              <form onSubmit={handleBulkImportCSV} className="space-y-4 h-full flex flex-col justify-end">
                <div className="relative group border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-all text-center bg-slate-50/40">
                  <input
                    id="csv-file-input" type="file" accept=".csv"
                    onChange={(e) => e.target.files && setCsvFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="space-y-1.5">
                    <FileSpreadsheet className={`w-8 h-8 mx-auto transition-colors ${csvFile ? 'text-emerald-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                    <p className="text-xs font-bold text-slate-700">
                      {csvFile ? csvFile.name : 'Pilih Berkas Spreadsheets'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Klik atau seret file ekstensi .csv ke sini'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit" disabled={isLoading || !csvFile}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🚀 Unggah & Eksekusi Massal'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* PANEL: TABEL DATA AKUN AKTIF */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-xs"
        >
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Daftar Akun Terdaftar di Sistem ({users.length})
              </h2>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                Kumpulan kredensial tervalidasi yang memiliki hak masuk ke pangkalan SMART CELL.
              </p>
            </div>
          </div>

          {isFetchLoading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Memuat pangkalan data pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs font-medium text-slate-400">
              Belum ada arsip akun terdaftar di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nama Lengkap / Identitas</th>
                    <th className="p-3.5 w-44">Tingkat Otoritas (Role)</th>
                    <th className="p-3.5 w-36 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 text-center font-bold text-slate-300">{index + 1}</td>
                      <td className="p-3.5 font-black text-slate-900 tracking-tight">{user.username}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase ${
                          user.role === 'super_admin' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                          user.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                          {user.role === 'super_admin' ? '👑 Super Admin' : 
                           user.role === 'admin' ? '👨‍🏫 Mentor (Admin)' : '🧒 Anak Binaan'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingUser({ id: user.id, username: user.username, role: user.role })
                            setIsEditModalOpen(true)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg font-bold transition-all disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* OVERLAY POP-UP MODAL: EDIT DATA USER */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ubah Data Pengguna</h3>
                </div>
                <button 
                  onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                  className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Username Baru</label>
                  <input
                    type="text" value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all font-medium" required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Tingkat Akses (Role)</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 bg-slate-50 focus:border-purple-500 focus:outline-none cursor-pointer font-bold transition-all"
                  >
                    <option value="user">Anak Binaan (Role: User)</option>
                    <option value="admin">Mentor / Staf LPKA (Role: Admin)</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingUser(null)
                    }}
                    className="w-1/2 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-1/2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:bg-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}