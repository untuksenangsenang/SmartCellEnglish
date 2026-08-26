'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Check } from 'lucide-react'

type LoginState = 'idle' | 'loading' | 'success'

export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginState, setLoginState]     = useState<LoginState>('idle')
  const [errorMsg, setErrorMsg]         = useState('')
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  const router   = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginState('loading')
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg(error.message)
      setLoginState('idle')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    setLoginState('success')

    // Brief success flash before redirect
    await new Promise(r => setTimeout(r, 600))

    if (profile?.role === 'super_admin') router.push('/super-admin')
    else if (profile?.role === 'admin')  router.push('/admin')
    else                                  router.push('/user')

    router.refresh()
  }

  const isLoading = loginState === 'loading'
  const isSuccess = loginState === 'success'

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] items-center justify-center bg-blue-50/40 px-4 py-16">

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* ── Card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-800 to-blue-400" />

          <div className="px-8 py-10">

            {/* ── Branding ─────────────────────────────────── */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Image
                  src="/logo.png"
                  alt="Smart Cell English"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Badge */}
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide rounded-full mb-3">
                Portal Belajar
              </span>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Smart Cell English
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-xs">
                Masuk menggunakan kredensial akun yang didaftarkan Administrator
              </p>
            </div>

            <div className="border-t border-slate-100 mb-7" />

            {/* ── Error message ─────────────────────────────── */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-0.5">Akses ditolak</p>
                      <p className="text-xs text-red-600 leading-relaxed">{errorMsg}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ──────────────────────────────────────── */}
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat email
                </label>
                <div className={`
                  relative flex items-center rounded-xl border bg-white transition-all duration-150
                  ${focusedField === 'email'
                    ? 'border-blue-400 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300'}
                `}>
                  <Mail className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${
                    focusedField === 'email' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="contoh@smartcell.com"
                    required
                    disabled={isLoading || isSuccess}
                    className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kata sandi
                </label>
                <div className={`
                  relative flex items-center rounded-xl border bg-white transition-all duration-150
                  ${focusedField === 'password'
                    ? 'border-blue-400 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300'}
                `}>
                  <Lock className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${
                    focusedField === 'password' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading || isSuccess}
                    className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={!isLoading && !isSuccess ? { scale: 0.985 } : {}}
                type="submit"
                disabled={isLoading || isSuccess}
                className={`
                  w-full flex items-center justify-center gap-2 py-3 px-5
                  rounded-xl font-semibold text-sm text-white
                  transition-all duration-200 mt-2
                  ${isSuccess
                    ? 'bg-blue-500 cursor-default'
                    : isLoading
                      ? 'bg-blue-700 cursor-not-allowed opacity-80'
                      : 'bg-blue-700 hover:bg-blue-800 hover:-translate-y-px active:translate-y-0 shadow-sm hover:shadow-blue-200'}
                `}
              >
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Berhasil masuk!
                    </motion.span>
                  ) : isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memverifikasi akun...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Masuk ke aplikasi
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

            </form>

            {/* ── Footer note ───────────────────────────────── */}
            <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
              Belum punya akun?{' '}
              <span className="text-blue-600 font-medium">Hubungi Administrator</span>
              {' '}untuk pendaftaran.
            </p>

          </div>
        </div>

        {/* Below-card label */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Smart Cell English · Universitas Ahmad Dahlan
        </p>
      </motion.div>

    </div>
  )
}