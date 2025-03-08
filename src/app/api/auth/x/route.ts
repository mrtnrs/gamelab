// src/app/api/auth/x/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Simple random string generator (not cryptographically secure)
const generateRandomString = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

export async function GET(req: NextRequest) {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Client ID is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  const gameSlug = searchParams.get("gameSlug");

  if (!gameId || !gameSlug) {
    return NextResponse.json({ error: "Missing gameId or gameSlug" }, { status: 400 });
  }

  // Generate state for CSRF protection
  const state = generateRandomString(16);

  // Build X.com OAuth 2.0 authorization URL (no PKCE)
  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", "tweet.read users.read");
  authUrl.searchParams.set("state", state);

  // Prepare the redirect response
  const response = NextResponse.redirect(authUrl);

  // Set cookies for state, gameId, and gameSlug (no codeVerifier)
  response.cookies.set("auth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 1800, // 30 minutes
    sameSite: "lax",
  });
  response.cookies.set("auth_game_id", gameId, {
    httpOnly: true,
    path: "/",
    maxAge: 1800,
    sameSite: "lax",
  });
  response.cookies.set("auth_game_slug", gameSlug, {
    httpOnly: true,
    path: "/",
    maxAge: 1800,
    sameSite: "lax",
  });

  return response;
}