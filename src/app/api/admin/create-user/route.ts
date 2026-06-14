import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // 1. Ambil environment variables di dalam runtime handler (Aman dari crash build Vercel)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 2. Guard clause jika environment variables belum dikonfigurasi di dashboard Vercel
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Konfigurasi environment variabel Supabase tidak ditemukan di server.' },
      { status: 500 }
    )
  }

  // 3. Inisialisasi Supabase khusus sisi server dengan Service Role Key di dalam request scope
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { email, password, username, role } = await request.json()

    if (!email || !password || !username || !role) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi!' }, { status: 400 })
    }

    // 1. Daftarkan user ke sistem Auth Supabase secara paksa (Auto-Confirm Email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: { role, username }
    })

    if (authError) throw authError

    // 2. Gunakan UPSERT agar otomatis INSERT jika kosong, atau UPDATE jika sudah ada
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: authData.user.id, 
        username: username, 
        role: role 
      })

    if (profileError) throw profileError

    return NextResponse.json({ success: true, message: `Akun ${username} dengan role ${role} berhasil dibuat!` })

  } catch (error: any) {
    console.error('Eror API Create User:', error.message)
    return NextResponse.json({ error: error.message || 'Gagal memproses pembuatan akun.' }, { status: 500 })
  }
}