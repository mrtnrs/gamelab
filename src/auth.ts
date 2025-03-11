// src/auth.ts
import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"

// Define custom session type to include game-specific information
interface ExtendedSession {
  user?: {
    id?: string
    name?: string
    email?: string
    image?: string
    xId?: string
    xHandle?: string
  }
  gameId?: string
  gameSlug?: string
  expires: string
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
export const { handlers, auth } = NextAuth({
  providers: [
    Twitter({
      clientId: process.env.NEXT_PUBLIC_X_CLIENT_ID as string,
      clientSecret: process.env.X_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure the Twitter profile is properly processed
      if (account?.provider === "twitter" && profile && "data" in profile) {
        // Use type assertion with unknown first to avoid TypeScript error
        const twitterProfile = profile as unknown as TwitterProfile;
        
        // Store Twitter data in user object for later use
        user.xId = twitterProfile.data.id;
        user.xHandle = twitterProfile.data.username;
      }
      
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && account.provider === "twitter" && profile && "data" in profile) {
        // Use type assertion with unknown first to avoid TypeScript error
        const twitterProfile = profile as unknown as TwitterProfile;
        token.accessToken = account.access_token;
        token.xId = twitterProfile.data.id;
        token.xHandle = twitterProfile.data.username;
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
        }
        extendedSession.gameId = token.gameId as string;
        extendedSession.gameSlug = token.gameSlug as string;
      }
      
      return extendedSession;
    },
  },
  // Use edge compatibility mode for Cloudflare
  trustHost: true,
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
