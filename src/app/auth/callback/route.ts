import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleAuthCallback } from "@/actions/supabase-auth-actions";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  
  // Get game context if present
  const gameId = requestUrl.searchParams.get("gameId");
  const gameSlug = requestUrl.searchParams.get("gameSlug");

  // If there's an error from Twitter/X, redirect to error page
  if (error) {
    console.error("Auth provider error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth-error?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`, 
      requestUrl.origin)
    );
  }

  // If we have a code, exchange it for a session
  if (code) {
    try {
      const supabase = createRouteHandlerClient({
        cookies,
      });
      
      // First exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      
      // If we have game context, handle the game claiming
      if (gameId && gameSlug) {
        // Now handle the authentication callback with our custom logic
        const result = await handleAuthCallback(code);
        
        if (result.redirect) {
          return NextResponse.redirect(new URL(result.redirect, requestUrl.origin));
        }
      }
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL(`/auth-error?error=session_exchange_failed`, requestUrl.origin)
      );
    }
  }

  // Default redirect to home page if nothing else matched
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}