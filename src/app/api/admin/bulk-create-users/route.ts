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

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json() // Menerima array [ {username, email, password, role}, ... ]

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Data pengguna tidak valid atau kosong.' }, { status: 400 })
    }

    const summary = {
      successCount: 0,
      failedCount: 0,
      failedDetails: [] as any[]
    }

    // Proses pembuatan akun secara berurutan (Sequential Loop)
    for (const user of users) {
      const { email, password, username, role } = user

      // Validasi baris data minimal
      if (!email || !password || !username || !role) {
        summary.failedCount++
        summary.failedDetails.push({ email: email || 'Tanpa Email', reason: 'Kolom tidak lengkap' })
        continue
      }

      try {
        // 1. Daftarkan ke Supabase Auth pusat
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password: password.trim(),
          email_confirm: true,
          user_metadata: { role, username }
        })

        if (authError) throw authError

        // 2. Sinkronisasikan ke tabel public.profiles
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: username.trim(),
            role: role.trim()
          })

        if (profileError) throw profileError

        summary.successCount++
      } catch (err: any) {
        summary.failedCount++
        summary.failedDetails.push({ email, reason: err.message || 'Gagal didaftarkan' })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proses massal selesai. ${summary.successCount} berhasil, ${summary.failedCount} gagal.`,
      summary
    })

  } catch (error: any) {
    console.error('Eror API Bulk Create User:', error.message)
    return NextResponse.json({ error: 'Gagal memproses unggahan massal.' }, { status: 500 })
  }
}