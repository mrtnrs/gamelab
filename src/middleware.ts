import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CookieOptions } from '@supabase/ssr';

// This middleware runs in the Edge runtime
export const runtime = 'experimental-edge';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set HttpOnly cookies by default for security
            res.cookies.set({
              name,
              value,
              ...options,
              httpOnly: options.httpOnly !== false,
            });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        }
      }
    );
    
    // Refresh session if expired - required for Server Components
    // This will set the auth cookie if it needs to be refreshed
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue even if there's an error with Supabase
  }
  
  return res;
}

// Specify which paths should trigger this middleware
export const config = {
  matcher: [
    // Match all paths except for:
    // - API routes
    // - Static files (e.g. /favicon.ico)
    // - Public files
    // - _next files
    // - Assets like images, fonts, etc.
    '/((?!_next/|api/|favicon.ico|public/|images/|assets/).*)',
  ],
};
