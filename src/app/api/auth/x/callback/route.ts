import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// X.com OAuth configuration
const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET; // Ensure this is set in your .env
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/x/callback`;

export async function GET(req: NextRequest) {
  try {
    // Get the cookie store
    const cookieStore = await cookies();

    // Retrieve cookie values
    const gameId = cookieStore.get("auth_game_id")?.value;
    const gameSlug = cookieStore.get("auth_game_slug")?.value;
    const codeVerifier = cookieStore.get("auth_code_verifier")?.value;
    const storedState = cookieStore.get("auth_state")?.value;

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // **Step 1: Validate Session and Cookies**
    if (!gameId || !gameSlug || !codeVerifier || !storedState) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/error?message=session-expired`
      );
    }

    // **Step 2: Validate State (CSRF Protection)**
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/error?message=invalid-state`
      );
    }

    // **Step 3: Handle Authentication Errors from X.com**
    if (error || !code) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=authentication-failed`
      );
    }

    // **Step 4: Exchange Authorization Code for Access Token**
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID!,
        code_verifier: codeVerifier,
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

    // **Step 5: Fetch User Profile**
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

    // **Step 6: Verify User's X Handle**
    // TODO: Replace this with your actual logic to determine the expected handle
    const expectedHandle = "someDeveloperHandle"; // Example; fetch from DB or config
    if (handle !== expectedHandle) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/games/${gameSlug}?error=handle-mismatch`
      );
    }

    // **Step 7: Success - Redirect to Game Page**
    const response = NextResponse.redirect(
      `${req.nextUrl.origin}/games/${gameSlug}?success=game-claimed`
    );

    // Clean up temporary cookies
    response.cookies.set("auth_state", "", { maxAge: 0 });
    response.cookies.set("auth_code_verifier", "", { maxAge: 0 });
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