import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function PUT(request: NextRequest) {
  try {
    const { id, username, role } = await request.json()

    if (!id || !username || !role) {
      return NextResponse.json({ error: 'Data pembaruan tidak lengkap.' }, { status: 400 })
    }

    // 1. Perbarui user_metadata di Supabase Auth pusat
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role, username }
    })

    if (authError) throw authError

    // 2. Perbarui baris data di tabel public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ username, role })
      .eq('id', id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true, message: 'Data akun berhasil diperbarui.' })

  } catch (error: any) {
    console.error('Eror API Update User:', error.message)
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data pengguna.' }, { status: 500 })
  }
}