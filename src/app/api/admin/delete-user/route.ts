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

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib disertakan.' }, { status: 400 })
    }

    // 1. Hapus dari tabel public.profiles terlebih dahulu
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) throw profileError

    // 2. Hapus dari Supabase Auth pusat (God Mode)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError) throw authError

    return NextResponse.json({ success: true, message: 'Akun dan profil pengguna berhasil dihapus permanen.' })

  } catch (error: any) {
    console.error('Eror API Delete User:', error.message)
    return NextResponse.json({ error: error.message || 'Gagal menghapus pengguna.' }, { status: 500 })
  }
}