// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl;

  // 1. INTERCEPTION FIX: 
  // If the user lands on root '/' with a 'code', it's likely a Supabase redirect 
  // that missed the callback URL. We manually forward them to the callback.
  if (url.pathname === '/' && url.searchParams.has('code')) {
    const code = url.searchParams.get('code');
    const newUrl = new URL('/auth/callback', req.url);
    newUrl.searchParams.set('code', code!);
    // Force the redirect to update-password
    newUrl.searchParams.set('next', '/update-password'); 
    return NextResponse.redirect(newUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;
  const authPages = ["/login", "/signup", "/forgot-password"]; // Added forgot-password

  if (session && authPages.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!session && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};