import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Log game detail page requests
  if (request.nextUrl.pathname.startsWith('/games/')) {
    const slug = request.nextUrl.pathname.split('/').pop();
    console.log(`[Middleware] Game detail page requested for slug: ${slug}`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all game detail pages
    '/games/:slug*',
  ],
};
