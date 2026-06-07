import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase khusus sisi server dengan Service Role Key (Bypass RLS & Auth Session)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
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

    // 🔥 LANGKAH 2 (PERBAIKAN): Gunakan UPSERT agar otomatis INSERT jika kosong, atau UPDATE jika sudah ada
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