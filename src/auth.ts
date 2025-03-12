// src/auth.ts
import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"
import { cookies } from "next/headers"

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

function extractHandleFromUrl(url: string): string {
  console.log('[extractHandleFromUrl] Processing URL:', { url });
  try {
    const match = url.match(/twitter\.com\/([^\/?]+)/i) || url.match(/x\.com\/([^\/?]+)/i);
    const handle = match ? match[1] : "";
    console.log('[extractHandleFromUrl] Result:', { handle });
    return handle;
  } catch (error) {
    console.error('[extractHandleFromUrl] Error:', error);
    return "";
  }
}

async function claimGame(gameId: string, xId: string, xHandle: string) {
  console.log('[claimGame] Starting with:', { gameId, xId, xHandle });
  const { createServerSupabaseClient } = await import("./utils/supabase-admin");
  const supabase = createServerSupabaseClient();
  
  try {
    console.log('[claimGame] Executing Supabase update');
    const { data, error } = await supabase
      .from("games")
      .update({ 
        claimed: true,
        claimed_by: xId,
        claimed_by_handle: xHandle
      })
      .eq("id", gameId)
      .select();
    
    console.log('[claimGame] Supabase response:', { data, error });
    if (error) throw error;
    console.log('[claimGame] Success');
    return { success: true };
  } catch (error) {
    console.error('[claimGame] Error:', error);
    return { success: false, error: "Failed to claim game" };
  }
}

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
        console.log('[Twitter Provider] Profile received:', profile);
        const twitterProfile = profile as unknown as TwitterProfile;
        const result = {
          id: twitterProfile.data.id,
          name: twitterProfile.data.name,
          image: twitterProfile.data.profile_image_url,
          xId: twitterProfile.data.id,
          xHandle: twitterProfile.data.username,
        };
        console.log('[Twitter Provider] Profile processed:', result);
        return result;
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[signIn Callback] Starting with:', { user, account, profile });
      if (account?.provider === "twitter" && profile && "data" in profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        const extUser = user as ExtendedUser;
        
        console.log('[signIn Callback] Processing Twitter profile:', twitterProfile);
        extUser.xId = twitterProfile.data.id;
        extUser.xHandle = twitterProfile.data.username;
        
        const cookieStore = await cookies();
        const gameIdCookie = cookieStore.get("game_claim_id")?.value;
        const gameSlugCookie = cookieStore.get("game_claim_slug")?.value;
        
        console.log('[signIn Callback] Cookies:', { gameIdCookie, gameSlugCookie });
        if (gameIdCookie && gameSlugCookie) {
          extUser.gameId = gameIdCookie;
          extUser.gameSlug = gameSlugCookie;
          console.log('[signIn Callback] Game context added to user:', { gameId: extUser.gameId, gameSlug: extUser.gameSlug });
        }
      }
      console.log('[signIn Callback] Complete:', { user });
      return true;
    },
    async jwt({ token, account, profile, user }) {
      console.log('[jwt Callback] Starting with:', { token, account, profile, user });
      if (account && account.provider === "twitter" && profile && "data" in profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        token.accessToken = account.access_token;
        token.xId = twitterProfile.data.id;
        token.xHandle = twitterProfile.data.username;
        console.log('[jwt Callback] Twitter data added:', { xId: token.xId, xHandle: token.xHandle });
      }
      
      if (user) {
        const extUser = user as ExtendedUser;
        if (extUser.gameId && extUser.gameSlug) {
          token.gameId = extUser.gameId;
          token.gameSlug = extUser.gameSlug;
          console.log('[jwt Callback] Game context added:', { gameId: token.gameId, gameSlug: token.gameSlug });
        }
      }
      
      console.log('[jwt Callback] Complete:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('[session Callback] Starting with:', { session, token });
      const extendedSession = session as ExtendedSession;
      
      if (token) {
        if (extendedSession.user) {
          extendedSession.user.xId = token.xId as string;
          extendedSession.user.xHandle = token.xHandle as string;
          console.log('[session Callback] User updated:', extendedSession.user);
        }
        
        if (token.gameId && token.gameSlug && token.xId && token.xHandle) {
          const gameId = token.gameId as string;
          const gameSlug = token.gameSlug as string;
          const xId = token.xId as string;
          const xHandle = token.xHandle as string;
          console.log('[session Callback] Game claim starting:', { gameId, gameSlug, xId, xHandle });

          try {
            const { createServerSupabaseClient } = await import("./utils/supabase-admin");
            const supabase = createServerSupabaseClient();
            console.log('[session Callback] Supabase client created');

            const { data: game, error: gameError } = await supabase
              .from('games')
              .select('developer_url, claimed')
              .eq('id', gameId)
              .single();

            console.log('[session Callback] Game fetch result:', { game, gameError });
            
            if (gameError || !game) {
              console.log('[session Callback] Game not found');
              extendedSession.claimResult = {
                success: false,
                redirect: `/games/${gameSlug}?error=${encodeURIComponent("game_not_found")}`
              };
            } else {
              const developerUrl = game.developer_url || "";
              const expectedHandle = extractHandleFromUrl(developerUrl);
              console.log('[session Callback] Handle verification:', { developerUrl, expectedHandle, xHandle });

              if (!expectedHandle) {
                console.log('[session Callback] Invalid developer URL');
                extendedSession.claimResult = {
                  success: false,
                  redirect: `/games/${gameSlug}?error=${encodeURIComponent("invalid_developer_url")}`
                };
              } else if (expectedHandle.toLowerCase() !== xHandle.toLowerCase()) {
                console.log('[session Callback] Handle mismatch');
                extendedSession.claimResult = {
                  success: false,
                  redirect: `/games/${gameSlug}?error=${encodeURIComponent("not_your_game")}`
                };
              } else {
                console.log('[session Callback] Attempting to claim game');
                const claimResult = await claimGame(gameId, xId, xHandle);
                console.log('[session Callback] Claim result:', claimResult);
                
                if (!claimResult.success) {
                  console.log('[session Callback] Claim failed');
                  extendedSession.claimResult = {
                    success: false,
                    redirect: `/games/${gameSlug}?error=${encodeURIComponent(claimResult.error || "update_failed")}`
                  };
                } else {
                  console.log('[session Callback] Running backup update');
                  const { error: functionError } = await supabase.rpc('update_game_claimed_status', {
                    game_id: gameId
                  });

                  console.log('[session Callback] Backup update result:', { functionError });
                  if (functionError) {
                    console.error('[session Callback] Backup update failed:', functionError);
                  }

                  console.log('[session Callback] Claim successful');
                  extendedSession.claimResult = {
                    success: true,
                    redirect: `/games/${gameSlug}?success=game-claimed`
                  };
                }
              }
            }

            console.log('[session Callback] Clearing cookies');
            const cookieStore = await cookies();
            cookieStore.delete("game_claim_id");
            cookieStore.delete("game_claim_slug");
          } catch (error) {
            console.error('[session Callback] Error in game claim process:', error);
            extendedSession.claimResult = {
              success: false,
              redirect: `/games/${gameSlug}?error=${encodeURIComponent("unexpected_error")}`
            };
          }
        }
      }
      
      console.log('[session Callback] Complete:', extendedSession);
      return extendedSession;
    },
  },
});