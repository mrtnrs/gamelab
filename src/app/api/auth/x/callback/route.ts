// src/app/api/auth/x/callback/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const gameId = cookieStore.get("auth_game_id")?.value;
    const gameSlug = cookieStore.get("auth_game_slug")?.value;
    const storedState = cookieStore.get("auth_state")?.value;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Validate session and cookies
    if (!gameId || !gameSlug || !storedState) {
      return NextResponse.redirect(`${req.nextUrl.origin}/error?message=session-expired`);
    }

    // Validate state (CSRF protection)
    if (!state || state !== storedState) {
      return NextResponse.redirect(`${req.nextUrl.origin}/error?message=invalid-state`);
    }

    // Handle authentication errors from X.com
    if (error || !code) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=authentication-failed`
      );
    }

    // Exchange authorization code for access token (no PKCE)
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID!,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", tokenResponse.status, errorData);
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=token-exchange-failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userResponse = await fetch("https://api.x.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error("User info fetch failed:", userResponse.status, errorData);
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=user-fetch-failed`
      );
    }

    const userData = await userResponse.json();
    const handle = userData.data.username;

    // Verify user's X handle (replace with your logic)
    const expectedHandle = "someDeveloperHandle";
    if (handle !== expectedHandle) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=handle-mismatch`
      );
    }

    // Success - redirect to game page
    const response = NextResponse.redirect(
      `${req.nextUrl.origin}/games/${gameSlug}?success=game-claimed`
    );

    // Clean up cookies
    response.cookies.set("auth_state", "", { maxAge: 0 });
    response.cookies.set("auth_game_id", "", { maxAge: 0 });
    response.cookies.set("auth_game_slug", "", { maxAge: 0 });

    return response;
  } catch (error) {
    console.error("X auth callback error:", error);
    const errorType = error instanceof Error ? error.message : "unknown";
    return NextResponse.redirect(
      `${req.nextUrl.origin}/error?error=${encodeURIComponent(errorType)}`
    );
  }
}