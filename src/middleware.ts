export { auth as middleware } from "@/auth"

// import { NextRequest, NextResponse } from "next/server";

// export function middleware(request: NextRequest) {
//   if (request.nextUrl.pathname === "/auth/callback") {
//     const code = request.nextUrl.searchParams.get("code") || "";
//     const state = request.nextUrl.searchParams.get("state") || "";
//     const error = request.nextUrl.searchParams.get("error") || "";

//     console.log("[Middleware] Extracted query params:", { code, state, error });

//     const newHeaders = new Headers(request.headers);
//     const cookieString = [
//       `x-oauth-code=${encodeURIComponent(code)}`,
//       `x-oauth-state=${encodeURIComponent(state)}`,
//       `x-oauth-error=${encodeURIComponent(error)}`,
//     ].join("; ");
//     newHeaders.set("cookie", cookieString);

//     return NextResponse.next({
//       request: {
//         headers: newHeaders,
//       },
//     });
//   }
//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/auth/callback"],
// };


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
