import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  const { gameId, gameSlug, state, codeVerifier, codeChallenge } = await request.json();

  if (!gameId || !gameSlug || !state || !codeVerifier || !codeChallenge) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID || "",
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    scope: "tweet.read users.read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })}`;

  const response = NextResponse.json({ authUrl });
  response.cookies.set("x_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 1800, // 30 minutes
  });
  response.cookies.set("x_auth_state", state, { secure: true, sameSite: "lax", maxAge: 1800 });
  return response;
}