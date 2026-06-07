'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 1. Jalankan proses autentikasi Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    // 2. Ambil role dari tabel profiles untuk menentukan kemana user harus diarahkan
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    // 3. Redirect otomatis berdasarkan role (Sesuai User Flow)
    if (profile?.role === 'super_admin') {
      router.push('/super-admin')
    } else if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }

    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">SMART CELL ENGLISH</h2>
        <p className="mb-4 text-center text-sm text-gray-500">Silakan masuk menggunakan akun simulasi</p>
        
        {errorMsg && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700 font-medium">
            ⚠️ Login Gagal: {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="contoh: binaan@smartcell.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              placeholder="password123"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 p-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Memproses Masuk...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  )
}