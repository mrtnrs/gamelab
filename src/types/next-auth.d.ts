// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in User type with custom properties
   */
  interface User {
    xId?: string;
    xHandle?: string;
    isDeveloperForGameId?: string;
  }

  /**
   * Extends the built-in Session type with custom properties
   */
  interface Session {
    user?: User;
    gameId?: string;
    gameSlug?: string;
  }

  /**
   * Extends the built-in JWT type with custom properties
   */
  interface JWT {
    accessToken?: string;
    xId?: string;
    xHandle?: string;
    gameId?: string;
    gameSlug?: string;
    isDeveloperForGameId?: string;
  }
}