// src/auth.ts
import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"
import { cookies } from "next/headers"
import { verifyAndClaimGame } from "./actions/game-auth-actions"

// Define custom session type to include game-specific information
interface ExtendedSession {
  user?: {
    id?: string
    name?: string
    email?: string
    image?: string
    xId?: string
    xHandle?: string
    gameId?: string
    gameSlug?: string
  }
  gameId?: string
  gameSlug?: string
  expires: string
  claimResult?: any
  claimError?: string
}

// Define Twitter profile type for better type checking
interface TwitterData {
  data: {
    username: string;
    name: string;
    profile_image_url: string;
    id: string;
  };
}

interface TwitterProfile {
  data: TwitterData["data"];
}

// Auth.js configuration
export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
  trustHost: true,
  providers: [
    Twitter({
      clientId: process.env.NEXT_PUBLIC_X_CLIENT_ID as string,
      clientSecret: process.env.X_CLIENT_SECRET as string,
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
      token: "https://api.x.com/2/oauth2/token",
      userinfo: "https://api.x.com/2/users/me?user.fields=profile_image_url",
      profile(profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        return {
          id: twitterProfile.data.id,
          name: twitterProfile.data.name,
          image: twitterProfile.data.profile_image_url,
          xId: twitterProfile.data.id,
          xHandle: twitterProfile.data.username,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      // Ensure the Twitter profile is properly processed
      if (account?.provider === "twitter" && profile && "data" in profile) {
        // Use type assertion with unknown first to avoid TypeScript error
        const twitterProfile = profile as unknown as TwitterProfile;
        
        // Store Twitter data in user object for later use
        user.xId = twitterProfile.data.id;
        user.xHandle = twitterProfile.data.username;
        
        // Check if there's a game claim request in the cookies
        const cookieStore = cookies();
        const gameIdCookie = cookieStore.get("game_claim_id")?.value;
        const gameSlugCookie = cookieStore.get("game_claim_slug")?.value;
        
        if (gameIdCookie && gameSlugCookie) {
          // We'll handle the game claiming in the session callback
          // Just pass the data through for now
          user.gameId = gameIdCookie;
          user.gameSlug = gameSlugCookie;
        }
      }
      
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account && account.provider === "twitter" && profile && "data" in profile) {
        // Use type assertion with unknown first to avoid TypeScript error
        const twitterProfile = profile as unknown as TwitterProfile;
        token.accessToken = account.access_token;
        token.xId = twitterProfile.data.id;
        token.xHandle = twitterProfile.data.username;
      }
      
      // Pass game claim information from user to token
      if (user && 'gameId' in user && 'gameSlug' in user) {
        token.gameId = user.gameId;
        token.gameSlug = user.gameSlug;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      const extendedSession = session as ExtendedSession;
      
      if (token) {
        if (extendedSession.user) {
          extendedSession.user.xId = token.xId as string;
          extendedSession.user.xHandle = token.xHandle as string;
          extendedSession.user.gameId = token.gameId as string;
          extendedSession.user.gameSlug = token.gameSlug as string;
        }
        extendedSession.gameId = token.gameId as string;
        extendedSession.gameSlug = token.gameSlug as string;
        
        // Handle game claiming if needed
        if (token.gameId && token.gameSlug && token.xId && token.xHandle) {
          try {
            // Attempt to claim the game
            const result = await verifyAndClaimGame(token.gameId as string, token.gameSlug as string);
            
            // Clear the claim cookies after processing
            const cookieStore = cookies();
            cookieStore.delete("game_claim_id");
            cookieStore.delete("game_claim_slug");
            
            // Store the claim result in the session for the client to handle
            extendedSession.claimResult = result;
          } catch (error) {
            console.error("Error claiming game during session callback:", error);
            // Add error information to the session
            extendedSession.claimError = "Failed to claim game";
          }
        }
      }
      
      return extendedSession;
    },
  },
})

// Helper function to claim a game using the authenticated user
export async function claimGameWithAuth(gameId: string) {
  const session = await auth()
  
  if (!session?.user?.xId || !session?.user?.xHandle) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Use your existing Supabase client
  const { createServerSupabaseClient } = await import("./utils/supabase-admin")
  const supabase = createServerSupabaseClient()
  
  try {
    // Update the game's claimed status
    const { data, error } = await supabase
      .from("games")
      .update({ 
        claimed: true,
      })
      .eq("id", gameId)
      .select()
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error("Error claiming game:", error)
    return { success: false, error: "Failed to claim game" }
  }
}
