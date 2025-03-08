import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/services/game-service';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get the gameId from the query parameters
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    let gameSlug = searchParams.get('gameSlug');
    
    if (!gameId) {
      return NextResponse.redirect(new URL('/?error=missing-game-id', request.url));
    }
    
    if (!gameSlug) {
      // Fallback to fetching the slug if it's not provided in the URL
     // const fetchedGameSlug = await gameService.getGameSlugById(gameId);
      
      // if (!fetchedGameSlug) {
      //   return NextResponse.redirect(new URL('/?error=game-not-found', request.url));
      // }
      
      // gameSlug = fetchedGameSlug;
    }
    
    // Get the X handle from the cookies
    const cookieStore = await cookies();
    const xHandle = cookieStore.get('x_handle')?.value;
    
    if (!xHandle) {
      return NextResponse.redirect(new URL(`/games/${gameSlug}?error=authentication-failed`, request.url));
    }
    
    // Call the game service to claim the game
    // const result = await gameService.claimGame(gameId, xHandle);
    const result = "hello";
    
    // if (result.success) {
    //   // Success - redirect to the game page with success message
    //   return NextResponse.redirect(new URL(`/games/${gameSlug}?success=game-claimed`, request.url));
    // } else {
      // Failed - redirect to the game page with error message
       // const errorParam = encodeURIComponent(result.error || 'unknown-error');
      const errorParam = encodeURIComponent('unknown-error');
       return NextResponse.redirect(new URL(`/games/${gameSlug}?error=${errorParam}`, request.url));

  } catch (error) {
    console.error('Error in claim-game API:', error);
    return NextResponse.redirect(new URL('/?error=server-error', request.url));
  }
}
