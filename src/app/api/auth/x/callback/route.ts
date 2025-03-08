// src/app/api/auth/x/callback/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Simple base64 encoder (no btoa)
const toBase64 = (str: string): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let bytes = new TextEncoder().encode(str);
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : 0;
    const b3 = i < bytes.length ? bytes[i++] : 0;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    const enc4 = b3 & 63;

    result += chars[enc1] + chars[enc2];
    result += b2 ? chars[enc3] : "=";
    result += b3 ? chars[enc4] : "=";
  }
  return result;
};

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

    if (!gameId || !gameSlug || !storedState) {
      return NextResponse.redirect(`${req.nextUrl.origin}/error?message=session-expired`);
    }

    if (!state || state !== storedState) {
      return NextResponse.redirect(`${req.nextUrl.origin}/error?message=invalid-state`);
    }

    if (error || !code) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=authentication-failed`
      );
    }

    // Manual base64 encoding for Authorization header
    const authString = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const base64Auth = toBase64(authString);

    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Auth}`,
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

    const expectedHandle = "someDeveloperHandle";
    if (handle !== expectedHandle) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=handle-mismatch`
      );
    }

    const response = NextResponse.redirect(
      `${req.nextUrl.origin}/games/${gameSlug}?success=game-claimed`
    );

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