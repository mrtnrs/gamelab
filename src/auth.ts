// src/auth.ts
import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import { cookies } from "next/headers";

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    xId?: string;
    xHandle?: string;
    gameId?: string;
    gameSlug?: string;
    claimResult?: {
      success: boolean;
      redirect?: string;
      error?: string;
    };
  };
  gameId?: string;
  gameSlug?: string;
  expires: string;
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
  claimResult?: {
    success: boolean;
    redirect?: string;
    error?: string;
  };
}

function extractHandleFromUrl(url: string): string {
  console.log('[extractHandleFromUrl] Processing URL:', { url });
  try {
    const match =
      url.match(/twitter\.com\/([^\/?]+)/i) ||
      url.match(/x\.com\/([^\/?]+)/i);
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
  const supabase = await createServerSupabaseClient();

  try {
    console.log('[claimGame] Executing Supabase update');
    const { data, error } = await supabase
      .from("games")
      .update({
        claimed: true,
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
      const extUser = user as ExtendedUser;
      if (account?.provider === "twitter" && profile && "data" in profile) {
        const twitterProfile = profile as unknown as TwitterProfile;
        

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
          console.log('[signIn Callback] Game context added to user:', {
            gameId: extUser.gameId,
            gameSlug: extUser.gameSlug,
          });

          // Perform game developer verification and claim process immediately
          try {
            const { createServerSupabaseClient } = await import("./utils/supabase-admin");
            const supabase = await createServerSupabaseClient();
            console.log('[signIn Callback] Supabase client created');

            const { data: game, error: gameError } = await supabase
              .from("games")
              .select("developer_url, claimed")
              .eq("id", gameIdCookie)
              .single();

            console.log('[signIn Callback] Game fetch result:', { game, gameError });

            if (gameError || !game) {
              console.log('[signIn Callback] Game not found');
              return `/games/${gameSlugCookie}?error=${encodeURIComponent("game_not_found")}`;
            }

            const developerUrl = game.developer_url || "";
            const expectedHandle = extractHandleFromUrl(developerUrl);
            console.log('[signIn Callback] Handle verification:', {
              developerUrl,
              expectedHandle,
              xHandle: extUser.xHandle,
            });

            if (!expectedHandle) {
              console.log('[signIn Callback] Invalid developer URL');
              return `/games/${gameSlugCookie}?error=${encodeURIComponent("invalid_developer_url")}`;
            } else if (expectedHandle.toLowerCase() !== extUser.xHandle!.toLowerCase()) {
              console.log('[signIn Callback] Handle mismatch');
              return `/games/${gameSlugCookie}?error=${encodeURIComponent("not_your_game")}`;
            } else {
              console.log('[signIn Callback] Attempting to claim game');
              const claimResult = await claimGame(gameIdCookie, extUser.xId!, extUser.xHandle!);
              console.log('[signIn Callback] Claim result:', claimResult);

              if (!claimResult.success) {
                console.log('[signIn Callback] Claim failed');
                return `/games/${gameSlugCookie}?error=${encodeURIComponent(claimResult.error || "update_failed")}`;
              } else {
                console.log('[signIn Callback] Running backup update');
                try {
                  const { error: functionError } = await supabase.rpc('update_game_claimed_status', {
                    game_id: gameIdCookie,
                  });
                  console.log('[signIn Callback] Backup update result:', { functionError });
                } catch (rpcError) {
                  console.error('[signIn Callback] RPC error:', rpcError);
                  // Continue even if RPC fails
                }

                // Set a cookie to indicate the game is claimed
                try {
                  cookieStore.set({
                    name: 'claimed_game_id',
                    value: gameIdCookie,
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                  });
                  
                  // Clear the claim cookies
                  cookieStore.set({
                    name: 'game_claim_id',
                    value: '',
                    path: '/',
                    maxAge: 0,
                  });
                  cookieStore.set({
                    name: 'game_claim_slug',
                    value: '',
                    path: '/',
                    maxAge: 0,
                  });
                } catch (cookieError) {
                  console.error('[signIn Callback] Cookie error:', cookieError);
                }

                console.log('[signIn Callback] Claim successful, redirecting');
                return `/games/${gameSlugCookie}?success=game-claimed`;
              }
            }
          } catch (error) {
            console.error('[signIn Callback] Error during claim process:', error);
            return `/games/${gameSlugCookie}?error=${encodeURIComponent("unexpected_error")}`;
          }
        }
      }
      return true;
    },
    async jwt({ token, account, profile, user }) {
      console.log('[jwt Callback] Starting with:', { token, account, profile, user });
      if (user) {
        const extUser = user as ExtendedUser;
        token.xId = extUser.xId;
        token.xHandle = extUser.xHandle;
        token.gameId = extUser.gameId;
        token.gameSlug = extUser.gameSlug;
        token.claimResult = extUser.claimResult;
        console.log('[jwt Callback] Token updated with user data:', token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[session Callback] Starting with:', { session, token });
      const extSession = session as ExtendedSession;
      if (extSession.user) {
        extSession.user.xId = token.xId as string;
        extSession.user.xHandle = token.xHandle as string;
        extSession.user.gameId = token.gameId as string;
        extSession.user.gameSlug = token.gameSlug as string;
        extSession.user.claimResult = token.claimResult as any;
      }
      console.log('[session Callback] Session updated with token data:', extSession);
      return extSession;
    },
  },
});
