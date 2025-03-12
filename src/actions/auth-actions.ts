// src/auth.ts
import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"
import { cookies } from "next/headers"

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
  claimResult?: {
    success: boolean
    redirect?: string
    error?: string
  }
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

// Extend the User type to include our custom properties
interface ExtendedUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  xId?: string;
  xHandle?: string;
  gameId?: string;
  gameSlug?: string;
}

// Helper function to extract handle from URL
function extractHandleFromUrl(url: string): string {
  try {
    const match = url.match(/twitter\.com\/([^\/?]+)/i) || url.match(/x\.com\/([^\/?]+)/i);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

// Helper function to claim game (moved from your separate function)
async function claimGame(gameId: string, xId: string, xHandle: string) {
  const { createServerSupabaseClient } = await import("./../utils/supabase-admin")
  const supabase = createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from("games")
      .update({ 
        claimed: true,
        claimed_by: xId,
        claimed_by_handle: xHandle
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter" && profile && "data" in profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        const extUser = user as ExtendedUser;
        
        extUser.xId = twitterProfile.data.id;
        extUser.xHandle = twitterProfile.data.username;
        
        const cookieStore = await cookies();
        const gameIdCookie = cookieStore.get("game_claim_id")?.value;
        const gameSlugCookie = cookieStore.get("game_claim_slug")?.value;
        
        if (gameIdCookie && gameSlugCookie) {
          extUser.gameId = gameIdCookie;
          extUser.gameSlug = gameSlugCookie;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account && account.provider === "twitter" && profile && "data" in profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        token.accessToken = account.access_token;
        token.xId = twitterProfile.data.id;
        token.xHandle = twitterProfile.data.username;
      }
      
      if (user) {
        const extUser = user as ExtendedUser;
        if (extUser.gameId && extUser.gameSlug) {
          token.gameId = extUser.gameId;
          token.gameSlug = extUser.gameSlug;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;
      
      if (token) {
        if (extendedSession.user) {
          extendedSession.user.xId = token.xId as string;
          extendedSession.user.xHandle = token.xHandle as string;
        }
        
        // Handle game claiming if present
        if (token.gameId && token.gameSlug && token.xId && token.xHandle) {
          const gameId = token.gameId as string;
          const gameSlug = token.gameSlug as string;
          const xId = token.xId as string;
          const xHandle = token.xHandle as string;

          try {
            const { createServerSupabaseClient } = await import("./../utils/supabase-admin");
            const supabase = createServerSupabaseClient();

            // Verify game exists and get developer URL
            const { data: game, error: gameError } = await supabase
              .from('games')
              .select('developer_url, claimed')
              .eq('id', gameId)
              .single();

            if (gameError || !game) {
              extendedSession.claimResult = {
                success: false,
                redirect: `/games/${gameSlug}?error=${encodeURIComponent("game_not_found")}`
              };
            } else {
              const developerUrl = game.developer_url || "";
              const expectedHandle = extractHandleFromUrl(developerUrl);

              if (!expectedHandle) {
                extendedSession.claimResult = {
                  success: false,
                  redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
                };
              } else if (expectedHandle.toLowerCase() !== xHandle.toLowerCase()) {
                extendedSession.claimResult = {
                  success: false,
                  redirect: `/games/${gameSlug}?error=${encodeURIComponent("not_your_game")}`
                };
              } else {
                const claimResult = await claimGame(gameId, xId, xHandle);
                
                if (!claimResult.success) {
                  extendedSession.claimResult = {
                    success: false,
                    redirect: `/games/${gameSlug}?error=${encodeURIComponent(claimResult.error || "update_failed")}`
                  };
                } else {
                  // Backup update via RPC
                  const { error: functionError } = await supabase.rpc('update_game_claimed_status', {
                    game_id: gameId
                  });

                  if (functionError) {
                    console.error('Error in update_game_claimed_status:', functionError);
                  }

                  extendedSession.claimResult = {
                    success: true,
                    redirect: `/games/${gameSlug}?success=game-claimed`
                  };
                }
              }
            }

            // Clear cookies after processing
            const cookieStore = await cookies();
            cookieStore.delete("game_claim_id");
            cookieStore.delete("game_claim_slug");
          } catch (error) {
            console.error('Error in game claim process:', error);
            extendedSession.claimResult = {
              success: false,
              redirect: `/games/${gameSlug}?error=${encodeURIComponent("unexpected_error")}`
            };
          }
        }
      }
      
      return extendedSession;
    },
  },
});