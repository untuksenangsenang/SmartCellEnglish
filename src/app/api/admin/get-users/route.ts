import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase khusus Server dengan Service Role Key untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Pastikan key ini ada di .env.local Anda
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export async function GET() {
  try {
    // Ambil semua data dari tabel profiles tanpa filter role
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, created_at')
      .order('username', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}