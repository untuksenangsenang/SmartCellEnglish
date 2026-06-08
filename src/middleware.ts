import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Inisialisasi Client Supabase khusus untuk lingkungan Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Ambil data session user yang sedang aktif dari Supabase Auth
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // Skenario A: Jika user BELUM login dan mencoba masuk ke area terproteksi
  if (!user && (url.pathname.startsWith('/user') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/super-admin'))) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

// Skenario B: Jika user SUDAH login
  if (user) {
    // Ambil data role mereka dari tabel public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // [PERBAIKAN CRITICAL]: Jika user punya session auth tapi profil/role tidak ditemukan di database,
    // langsung lempar ke login, jangan di-redirect ke dashboard manapun untuk menghindari loop!
    if (!role) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Jika sudah login tapi iseng ketik URL /login, arahkan ke dashboard masing-masing
    if (url.pathname.startsWith('/login')) {
      if (role === 'super_admin') url.pathname = '/super-admin'
      else if (role === 'admin') url.pathname = '/admin'
      else url.pathname = '/user'
      return NextResponse.redirect(url)
    }

    // Proteksi Lintas Role (Anti Maling Akses)
    if (url.pathname.startsWith('/user') && role !== 'user') {
      url.pathname = role === 'super_admin' ? '/super-admin' : '/admin'
      return NextResponse.redirect(url)
    }

    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = role === 'super_admin' ? '/super-admin' : '/user'
      return NextResponse.redirect(url)
    }

    if (url.pathname.startsWith('/super-admin') && role !== 'super_admin') {
      url.pathname = role === 'admin' ? '/admin' : '/user'
      return NextResponse.redirect(url)
    }
  }

  return response
}

// Menentukan rute mana saja yang harus diawasi oleh Middleware ini
export const config = {
  matcher: ['/user/:path*', '/admin/:path*', '/super-admin/:path*', '/login'],
}