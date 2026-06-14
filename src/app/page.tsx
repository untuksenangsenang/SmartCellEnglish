'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { BookOpen, Mic, Target, ArrowRight, Play, Users, BookMarked, Star } from 'lucide-react'

// ─── Hook: Typing Effect ──────────────────────────────────────────────────────
function useTypingEffect(phrases: string[], speed = 52, deleteSpeed = 38, pause = 1800) {
  const [displayed, setDisplayed] = useState('')
  const state = useRef({ pi: 0, ci: 0, deleting: false })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function tick() {
      const { pi, ci, deleting } = state.current
      const txt = phrases[pi]
      if (!deleting) {
        setDisplayed(txt.slice(0, ci + 1))
        state.current.ci++
        if (state.current.ci >= txt.length) {
          state.current.deleting = true
          timer = setTimeout(tick, pause)
          return
        }
      } else {
        setDisplayed(txt.slice(0, ci - 1))
        state.current.ci--
        if (state.current.ci <= 0) {
          state.current.deleting = false
          state.current.pi = (pi + 1) % phrases.length
        }
      }
      timer = setTimeout(tick, deleting ? deleteSpeed : speed)
    }
    timer = setTimeout(tick, 700)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return displayed
}

// ─── Hook: Count-up on intersection ──────────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        let start = 0
        const steps = Math.ceil(duration / 16)
        const inc = target / steps
        const t = setInterval(() => {
          start += inc
          if (start >= target) { setValue(target); clearInterval(t) }
          else setValue(Math.round(start))
        }, 16)
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])
  return { ref, value }
}

// ─── Hook: Animated progress bar ─────────────────────────────────────────────
function AnimatedBar({ label, target }: { label: string; target: number }) {
  const [pct, setPct] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      let v = 0
      const t = setInterval(() => {
        v += 2; if (v >= target) { setPct(target); clearInterval(t) } else setPct(v)
      }, 18)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return (
    <div ref={ref} className="mb-5 last:mb-0">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-bold text-[#0d3d2e]">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0d3d2e,#d4f244)' }}
        />
      </div>
    </div>
  )
}

// ─── Stat counter ────────────────────────────────────────────────────────────
function StatItem({ target, suffix, label }: { target: number; suffix?: string; label: string }) {
  const { ref, value } = useCountUp(target)
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-0.5">
        <span ref={ref} className="text-4xl md:text-5xl font-black text-white leading-none">
          {value}
        </span>
        <span className="text-4xl md:text-5xl font-black text-[#d4f244] leading-none">{suffix}</span>
      </div>
      <div className="w-8 h-0.5 bg-[#d4f244]" />
      <p className="text-sm text-white/60 font-medium pt-1">{label}</p>
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon, num, title, desc, delay
}: {
  icon: React.ReactNode; num: string; title: string; desc: string; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      setTimeout(() => setVisible(true), delay)
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`
        relative group transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
      `}
    >
      {/* Big bg number */}
      <span className="absolute -top-4 -left-1 text-7xl font-black text-slate-100 select-none pointer-events-none leading-none">
        {num}
      </span>
      <div className="relative pt-6 pb-2">
        <div className="w-10 h-10 rounded-xl bg-[#d4f244] flex items-center justify-center mb-4 text-[#0d3d2e]
          group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="w-6 h-0.5 bg-[#d4f244] mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const typed  = useTypingEffect([
    'Microlearning · Podcast · Quiz Otomatis.',
    'Belajar mandiri, kreatif, dan penuh potensi.',
    'Ruang bimbingan bahasa Inggris untuk Anak Binaan.',
  ])

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }
  const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
  }

  return (
    <div className="w-full bg-white text-slate-900 scroll-smooth selection:bg-[#d4f244] selection:text-[#0d3d2e]">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden px-6 md:px-16 lg:px-24"
        style={{ background: '#0d3d2e' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute top-10 right-[38%] w-4 h-4 rounded-full bg-[#d4f244]" />
        <div className="pointer-events-none absolute top-20 right-[34%] w-2.5 h-2.5 rounded-full bg-[#d4f244]/60" />
        <div
          className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border-[80px] opacity-20"
          style={{ borderColor: '#d4f244' }}
        />
        <div
          className="pointer-events-none absolute right-32 bottom-8 w-28 h-28 rounded-full"
          style={{ background: '#d4f244', opacity: 0.15 }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">

          {/* Left */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/70 text-xs font-semibold tracking-widest uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4f244]" />
              Digital Learning Ecosystem
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight text-white"
            >
              Platform belajar{' '}
              <span style={{ color: '#d4f244' }}>terbaik</span>{' '}
              untuk masa depan.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-sm text-white/60 font-medium min-h-[1.5rem]"
            >
              {typed}
              <span className="inline-block w-0.5 h-4 bg-[#d4f244] ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-[#0d3d2e] hover:brightness-90 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#d4f244' }}
              >
                Mulai Belajar
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white border border-white/30 hover:border-white/60 hover:bg-white/5 transition-all duration-200"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Cara Kerja
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="pt-4 flex flex-wrap gap-10"
            >
              <StatItem target={120} suffix="+" label="Materi Modul" />
              <StatItem target={48}       label="Anak Binaan" />
              <StatItem target={3}        label="Peran Akses" />
            </motion.div>
          </div>

          {/* Right — decorative card stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            {/* Background circle */}
            <div
              className="w-[360px] h-[360px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-[280px] h-[280px] rounded-full flex items-center justify-center"
                style={{ background: 'rgba(212,242,68,0.1)' }}
              >
                <BookMarked className="w-24 h-24 text-[#d4f244] opacity-80" />
              </div>
            </div>

            {/* Floating card 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-6 top-12 bg-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#d4f244' }}>
                <Star className="w-4 h-4 text-[#0d3d2e] fill-[#0d3d2e]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Top Learner</p>
                <p className="text-[10px] text-slate-500">Skor 97% quiz</p>
              </div>
            </motion.div>

            {/* Floating card 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -right-4 bottom-16 bg-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0d3d2e] flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">48 Binaan</p>
                <p className="text-[10px] text-slate-500">Aktif belajar</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. CARA KERJA ─────────────────────────────────────────────────── */}
      <section id="cara-kerja" className="py-28 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

          {/* Left */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="space-y-6 lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: '#0d3d2e', color: '#d4f244' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4f244]" />
              Dijamin & Terstruktur
            </div>
            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">
              Belajar online{' '}
              <span className="relative">
                kapan saja
                <span className="absolute -bottom-1 left-0 w-full h-1 rounded-full" style={{ background: '#d4f244' }} />
              </span>{' '}
              & di mana saja.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Platform SmartCellEnglish dirancang agar Anak Binaan bisa mengakses materi, merekam podcast, dan mengerjakan kuis kapan pun tanpa batasan.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#0d3d2e' }}
            >
              Pelajari Lebih Lanjut <ArrowRight className="w-4 h-4" />
            </button>

            {/* Avatars */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {['#059669', '#0284c7', '#7c3aed', '#dc2626'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: c }}>
                    {['R','A','F','I'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kursus online dari <span className="font-bold text-slate-800 underline underline-offset-2">para mentor.</span>
              </p>
            </div>
          </motion.div>

          {/* Right — feature list */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="space-y-10"
          >
            <FeatureCard delay={0}   num="01" icon={<BookOpen className="w-5 h-5" />}
              title="Jadwal Fleksibel"
              desc="Akses modul microlearning harian kapan pun — materi dirancang ringkas agar bisa diselesaikan dalam 15 menit." />
            <FeatureCard delay={120} num="02" icon={<Mic className="w-5 h-5" />}
              title="Podcast Recorder"
              desc="Rekam speaking langsung di browser, unggah ke Cloud Mentor, dan dapatkan feedback dari pengajar secara langsung." />
            <FeatureCard delay={240} num="03" icon={<Target className="w-5 h-5" />}
              title="Kuis Interaktif"
              desc="Evaluasi otomatis setiap modul — skor dikalkulasi instan dan terkirim ke dashboard pemantauan Mentor." />
          </motion.div>
        </div>
      </section>

      {/* ── 3. PROGRESS DEMO ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-16 lg:px-24" style={{ background: '#f7fdf5' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-5"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: '#0d3d2e', color: '#d4f244' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4f244]" />
                Progress Belajar
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Pantau perkembangan<br />setiap saat.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Dashboard real-time memungkinkan Mentor memantau progres setiap Anak Binaan dari modul yang diselesaikan hingga skor quiz terbaru.
            </motion.p>
            <motion.button
              variants={fadeUp}
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-[#0d3d2e] hover:brightness-90 transition-all hover:-translate-y-0.5"
              style={{ background: '#d4f244' }}
            >
              Lihat Dashboard <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
          >
            <AnimatedBar label="Vocabulary Basics"      target={82} />
            <AnimatedBar label="Grammar Fundamentals"  target={61} />
            <AnimatedBar label="Speaking Practice"      target={45} />
            <AnimatedBar label="Reading Comprehension" target={73} />
          </motion.div>
        </div>
      </section>

      {/* ── 4. CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-16 lg:px-24 relative overflow-hidden text-center" style={{ background: '#0d3d2e' }}>
        {/* Decorative */}
        <div className="pointer-events-none absolute -left-20 -bottom-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: '#d4f244' }} />
        <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#d4f244' }} />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative z-10 max-w-2xl mx-auto space-y-6"
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Siap melangkah<br />
            <span style={{ color: '#d4f244' }}>lebih jauh?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
            Gunakan kredensial akun internal yang didaftarkan Administrator untuk masuk ke sistem monitoring bimbingan.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3.5 rounded-full font-bold text-sm text-[#0d3d2e] hover:brightness-90 transition-all hover:-translate-y-0.5"
              style={{ background: '#d4f244' }}
            >
              Masuk ke Portal Belajar
            </button>
          </motion.div>
          <motion.p variants={fadeUp} className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Akses hanya untuk Anak Binaan terdaftar · Hubungi Admin jika belum memiliki akun
          </motion.p>
        </motion.div>
      </section>

    </div>
  )
}