"use server";
// src/components/changelog-manager.tsx
import { gameService, Changelog as ServiceChangelog } from '@/services/game-service';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import ChangelogManagerClient from './changelog-manager-client';

// Define the client-side Changelog interface
interface ClientChangelog {
  id: string;
  game_id: string;
  title: string;
  content: string;
  version?: string;
  created_at: string;
  updated_at?: string;
  tweet_id?: string;
}

interface ChangelogManagerProps {
  gameId: string;
  claimed: boolean;
}

// Helper function to extract handle from URL
function extractHandleFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    let urlObj: URL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlObj = new URL(`https://${url}`);
    } else {
      urlObj = new URL(url);
    }
    const path = urlObj.pathname.replace(/^\//, '');
    return path.split('/')[0] || null;
  } catch (error) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/i);
    return match ? match[1] : null;
  }
}

// Adapter function to convert service changelogs to client changelogs
function adaptChangelogs(serviceChangelogs: ServiceChangelog[]): ClientChangelog[] {
  return serviceChangelogs.map(changelog => ({
    id: changelog.id,
    game_id: '', // This will be filled in below
    title: changelog.title,
    content: changelog.content,
    version: changelog.version,
    created_at: changelog.date,
    updated_at: undefined,
    tweet_id: undefined
  }));
}

export default async function ChangelogManager({ gameId, claimed }: ChangelogManagerProps) {
  let changelogs: ServiceChangelog[] = [];
  let error: string | null = null;
  let isGameDeveloper = false;

  try {
    // Fetch changelogs
    changelogs = await gameService.getChangelogs(gameId);
    console.log(`ChangelogManager: Fetched ${changelogs.length} changelogs server-side`);

    // Sort changelogs by date (newest first)
    changelogs = changelogs.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Check if user is the developer
    if (claimed) {
      const cookieStore = await cookies();
      const xHandle = cookieStore.get('x_handle')?.value;

      if (xHandle) {
        console.log('ChangelogManager: User X handle:', xHandle);
        
        // Get game details to check developer URL
        const game = await gameService.getGameById(gameId);
        if (game && game.developer_url) {
          const gameDeveloperHandle = extractHandleFromUrl(game.developer_url);
          console.log('ChangelogManager: Game developer handle:', gameDeveloperHandle);
          
          if (gameDeveloperHandle && gameDeveloperHandle.toLowerCase() === xHandle.toLowerCase()) {
            isGameDeveloper = true;
            console.log('ChangelogManager: User is the game developer');
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in ChangelogManager:', err);
    error = 'Failed to load changelogs';
  }

  // Convert service changelogs to client changelogs
  const clientChangelogs = adaptChangelogs(changelogs).map(changelog => ({
    ...changelog,
    game_id: gameId
  }));

  return (
    <ChangelogManagerClient
      gameId={gameId}
      isGameDeveloper={isGameDeveloper}
      initialChangelogs={clientChangelogs}
      initialError={error}
    />
  );
}