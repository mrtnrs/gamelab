// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export const runtime = "edge";

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const code = searchParams.get("code");
//     const state = searchParams.get("state");

//     if (!code || !state) {
//       return NextResponse.redirect(
//         new URL("/games?error=missing_code_or_state", process.env.NEXT_PUBLIC_BASE_URL)
//       );
//     }

//     // Parse state to extract original state, gameId, and gameSlug
//     const [storedState, gameId, gameSlug] = state.split("|");
//     if (!storedState || !gameId || !gameSlug) {
//       return NextResponse.redirect(
//         new URL("/games?error=invalid_state", process.env.NEXT_PUBLIC_BASE_URL)
//       );
//     }

//     // Retrieve codeVerifier from client-side cookie
//     const cookieStore = await cookies();
//     const storedCodeVerifier = cookieStore.get("x_code_verifier")?.value;
//     const storedStateCookie = cookieStore.get("x_auth_state")?.value;

//     if (!storedCodeVerifier || !storedStateCookie || storedStateCookie !== storedState) {
//       return NextResponse.redirect(
//         new URL("/games?error=state_or_verifier_missing", process.env.NEXT_PUBLIC_BASE_URL)
//       );
//     }

//     // Exchange code for tokens
//     const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: new URLSearchParams({
//         grant_type: "authorization_code",
//         client_id: process.env.X_CLIENT_ID || "",
//         code_verifier: storedCodeVerifier,
//         code: code,
//         redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
//       }),
//     });

//     if (!tokenResponse.ok) {
//       throw new Error("Failed to exchange code for tokens");
//     }

//     const tokenData = await tokenResponse.json();
//     // Add your logic to verify the developer (e.g., check X handle against developerUrl)
//     // For now, assume success and redirect
//     return NextResponse.redirect(
//       new URL(`/games/${gameSlug}?success=game-claimed`, process.env.NEXT_PUBLIC_BASE_URL)
//     );
//   } catch (error) {
//     console.error("Error in auth callback:", error);
//     return NextResponse.redirect(
//       new URL("/games?error=auth_failed", process.env.NEXT_PUBLIC_BASE_URL)
//     );
//   }
// }