// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  
  // Get the 'next' param. 
  // If missing, default to /dashboard, UNLESS it's a recovery flow (handled below)
  let next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }
      
      // Optional: Check if the user is visiting dashboard but meant to update password
      // (This relies on the 'next' param being passed correctly from the client)
      console.log("Redirecting to:", next);

    } catch (error) {
      console.error('Error in auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  // If 'next' comes in as a relative path, prepend origin
  if (next.startsWith('/')) {
    next = `${origin}${next}`
  }

  return NextResponse.redirect(next)
}