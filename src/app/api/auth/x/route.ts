// src/app/api/auth/x/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Helper function to generate a random string using Web Crypto
const generateRandomString = async (length: number): Promise<string> => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length); // Ensure exact length
};

// Helper function to generate SHA-256 hash for PKCE code challenge
const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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

  // Generate state for CSRF protection (32 hex chars = 16 bytes)
  const state = await generateRandomString(32);

  // Generate PKCE parameters
  const codeVerifier = await generateRandomString(64); // 32 bytes = 64 hex chars
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Build X.com OAuth 2.0 authorization URL
  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", "tweet.read users.read");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // Prepare the redirect response
  const response = NextResponse.redirect(authUrl);

  // Set cookies for state, codeVerifier, gameId, and gameSlug
  response.cookies.set("auth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 1800, // 30 minutes
    sameSite: "lax",
  });
  response.cookies.set("auth_code_verifier", codeVerifier, {
    httpOnly: true,
    path: "/",
    maxAge: 1800,
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