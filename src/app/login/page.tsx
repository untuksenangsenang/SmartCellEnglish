'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

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
    // Background diubah menjadi bg-white murni
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16 selection:bg-emerald-500 selection:text-white">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg rounded-2xl bg-white p-8 sm:p-12 border border-slate-200/80 shadow-xl shadow-slate-100"
      >
        {/* Branding Head */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative w-16 h-16 mb-5 bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Smart Cell English Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            SMART CELL ENGLISH
          </h2>
          <p className="mt-2.5 text-base text-slate-500 font-medium max-w-sm">
            Silakan masuk untuk mengakses portal belajar mandiri Anda
          </p>
        </div>
        
        {/* Notifikasi Eror */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-start gap-3.5 rounded-xl bg-red-50 p-5 text-sm font-semibold text-red-700 border border-red-100"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-base mb-0.5">Akses Ditolak</span>
              {errorMsg}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-7">
          {/* Input Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-600 block pl-0.5">
              Alamat Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all font-medium"
                placeholder="contoh: binaan@smartcell.com"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-600 block pl-0.5">
              Kata Sandi
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Tombol Akses Masuk */}
          <motion.button
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 px-6 font-bold text-base text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memverifikasi Akun...
              </>
            ) : (
              <>
                Masuk ke Aplikasi
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

      </motion.div>
    </div>
  )
}