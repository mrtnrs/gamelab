import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Handle /auth/callback route
  if (request.nextUrl.pathname === "/auth/callback") {
    // Extract query parameters
    const url = request.nextUrl;
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    const error = url.searchParams.get("error") || "";

    // Create new headers with the extracted parameters
    const headers = new Headers(request.headers);
    headers.set("x-oauth-code", code);
    headers.set("x-oauth-state", state);
    headers.set("x-oauth-error", error);

    // Return the response with updated headers
    return NextResponse.next({ headers });
  }

  // Log game detail page requests
  if (request.nextUrl.pathname.startsWith("/games/")) {
    const slug = request.nextUrl.pathname.split("/").pop();
    console.log(`[Middleware] Game detail page requested for slug: ${slug}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/callback", // Apply to callback route
    "/games/:slug*", // Match all game detail pages
  ],
};

// import { NextRequest, NextResponse } from 'next/server';

// export function middleware(request: NextRequest) {
//   // Log game detail page requests
//   if (request.nextUrl.pathname.startsWith('/games/')) {
//     const slug = request.nextUrl.pathname.split('/').pop();
//     console.log(`[Middleware] Game detail page requested for slug: ${slug}`);
//   }
  
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     // Match all game detail pages
//     '/games/:slug*',
//   ],
// };
