"use server"

import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/utils/supabase-admin";
import { gameService, Changelog } from "@/services/game-service";


// Helper function to extract the handle from a URL.
function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    let urlObj: URL =
      url.startsWith("http://") || url.startsWith("https://")
        ? new URL(url)
        : new URL(`https://${url}`);
    const path = urlObj.pathname.replace(/^\//, "");
    return path.split("/")[0] || null;
  } catch (error) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  }
}

// Create a new changelog
export async function createChangelog(data: {
  game_id: string;
  title: string;
  content: string;
}): Promise<any> {
  // Retrieve the current Session

  console.log("[createChangelog] Invoked with data:", data);

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Create Supabase client and fetch game details.
  const supabase = await createServerSupabaseClient();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("developer_url, claimed")
    .eq("id", data.game_id)
    .single();

  if (gameError || !game) {
    throw new Error("Game not found");
  }

  // Validate that the user is the verified owner.
  const expectedHandle = extractHandleFromUrl(game.developer_url);
  if (
    !expectedHandle ||
    expectedHandle.toLowerCase() !== session.user.xHandle?.toLowerCase()
  ) {
    throw new Error("You are not the verified owner");
  }

  // Ensure the game is claimed.
  if (!game.claimed) {
    throw new Error("You must claim this game before adding changelogs");
  }

  // Proceed with creating the changelog.
  const changelog = {
    title: data.title,
    version: "1.0.0",
    date: new Date().toISOString(),
    content: data.content,
  };

  const result = await gameService.addChangelog(data.game_id, changelog);

  if (!result.success) {
    throw new Error(result.error || "Failed to create changelog");
  }

  return {
    id: result.changelogId,
    ...changelog,
  };
}

// Update an existing changelog
export async function updateChangelog(
  id: string,
  data: { game_id: string; title: string; content: string }
): Promise<any> {
  // Retrieve the current session
  console.log("[updateChangelog] Invoked with data:", data);

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Create Supabase client and fetch game details.
  const supabase = await createServerSupabaseClient();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("developer_url, claimed")
    .eq("id", data.game_id)
    .single();

  if (gameError || !game) {
    throw new Error("Game not found");
  }

  // Validate that the user is the verified owner.
  const expectedHandle = extractHandleFromUrl(game.developer_url);
  if (
    !expectedHandle ||
    expectedHandle.toLowerCase() !== session.user.xHandle?.toLowerCase()
  ) {
    throw new Error("You are not the verified owner");
  }

  // Ensure the game is claimed.
  if (!game.claimed) {
    throw new Error("You must claim this game before updating changelogs");
  }

  // Proceed with updating the changelog.
  const changelog = {
    title: data.title,
    content: data.content,
    date: new Date().toISOString(),
  };

  const result = await gameService.updateChangelog(data.game_id, id, changelog);

  if (!result.success) {
    throw new Error(result.error || "Failed to update changelog");
  }

  return {
    id,
    ...changelog,
  };
}

// Delete a changelog
export async function deleteChangelog(
  id: string,
  gameId: string
): Promise<void> {
  // Retrieve the current session
  console.log("[deleteChangelog] Invoked with data:", id, gameId);

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Create Supabase client and fetch game details.
  const supabase = await createServerSupabaseClient();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("developer_url, claimed")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    throw new Error("Game not found");
  }

  // Validate that the user is the verified owner.
  const expectedHandle = extractHandleFromUrl(game.developer_url);
  if (
    !expectedHandle ||
    expectedHandle.toLowerCase() !== session.user.xHandle?.toLowerCase()
  ) {
    throw new Error("You are not the verified owner");
  }

  // Ensure the game is claimed.
  if (!game.claimed) {
    throw new Error("You must claim this game before deleting changelogs");
  }

  // Proceed with deleting the changelog.
  const result = await gameService.deleteChangelog(gameId, id);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete changelog");
  }
}
