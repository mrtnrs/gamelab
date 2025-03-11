import { gameService, Changelog as ServiceChangelog } from '@/services/game-service';
import { auth } from '@/auth';
import ChangelogManagerClient from './changelog-manager-client';

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
  isGameDeveloper: boolean;
  clientChangelogs: any[];
  error?: string | null | undefined;
}

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

function adaptChangelogs(serviceChangelogs: ServiceChangelog[]): ClientChangelog[] {
  return serviceChangelogs.map(changelog => ({
    id: changelog.id,
    game_id: '',
    title: changelog.title,
    content: changelog.content,
    version: changelog.version,
    created_at: changelog.date,
    updated_at: undefined,
    tweet_id: undefined
  }));
}

export default function ChangelogManager({
  gameId,
  isGameDeveloper,
  clientChangelogs,
  error,
}: ChangelogManagerProps) {


  return (
    <ChangelogManagerClient
      gameId={gameId}
      isGameDeveloper={isGameDeveloper}
      initialChangelogs={clientChangelogs}
      initialError={error}
    />
  );
}