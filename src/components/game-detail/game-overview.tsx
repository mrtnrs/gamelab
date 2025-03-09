"use client";

import { Game } from '@/types/game';
import { Changelog as ServiceChangelog } from '@/services/game-service';
import ChangelogManagerClient from '@/components/changelog-manager-client';
import GameRating from '@/components/game-rating';

interface Changelog {
  id: string;
  game_id: string;
  title: string;
  content: string;
  version?: string;
  created_at: string;
  updated_at?: string;
  tweet_id?: string;
}

interface GameOverviewProps {
  formattedGame: any;
  game: Game;
  initialChangelogs: ServiceChangelog[];
  isGameDeveloper: boolean;
  userRating: number | null;
  handleRateGame: (rating: number) => Promise<void>;
}

export default function GameOverview({
  formattedGame,
  game,
  initialChangelogs,
  isGameDeveloper,
  userRating,
  handleRateGame
}: GameOverviewProps) {
  const hasFeatures = formattedGame.features && formattedGame.features.length > 0;
  const hasTags = game.tags && game.tags.length > 0;
  const hasChangelogs = initialChangelogs && initialChangelogs.length > 0;
  
  // Adapter function to convert service changelogs to client changelogs
  const adaptChangelogs = (serviceChangelogs: ServiceChangelog[]): Changelog[] => {
    return serviceChangelogs.map(changelog => ({
      id: changelog.id,
      game_id: formattedGame.id,
      title: changelog.title,
      content: changelog.content,
      version: changelog.version,
      created_at: changelog.date,
      updated_at: undefined,
      tweet_id: undefined
    }));
  };
  
  // Convert service changelogs to client changelogs
  const clientChangelogs = adaptChangelogs(initialChangelogs);
  
  // Format the date to show Month Year if available
  const formattedDate = (() => {
    if (!game.created_at) return formattedGame.year;
    
    try {
      const date = new Date(game.created_at);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (error) {
      return formattedGame.year;
    }
  })();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <div className="md:col-span-2">
        <h2 className="text-2xl font-semibold mb-4">About this game</h2>
        <p className="text-muted-foreground mb-6">{formattedGame.description}</p>
        
        {hasFeatures && (
          <>
            <h3 className="text-xl font-semibold mb-3">Features</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {formattedGame.features.map((feature: string, index: number) => (
                <span key={index} className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
                  {feature}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Changelogs Section - Only show if there are changelogs or the user is the developer */}
        {(hasChangelogs || isGameDeveloper) && (
          <div className="mt-8 mb-6">
            {isGameDeveloper && (
              <div className="bg-green-100 dark:bg-green-900/20 p-4 mb-4 rounded-md">
                <p className="text-green-800 dark:text-green-300">
                  You are the developer of this game. You can add changelogs below.
                </p>
              </div>
            )}
            <ChangelogManagerClient
              gameId={formattedGame.id}
              isGameDeveloper={isGameDeveloper}
              initialChangelogs={clientChangelogs}
              initialError={null}
            />
          </div>
        )}
      </div>

      <div className="md:col-span-1">
        <h2 className="text-2xl font-semibold mb-4">Game Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Release Date</h3>
            <p>{formattedDate}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
            <p>
              {formattedGame.creator.social_link ? (
                <a 
                  href={formattedGame.creator.social_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {formattedGame.creator.name}
                </a>
              ) : (
                formattedGame.creator.name
              )}
            </p>
          </div>
          <div className="hidden">
            <h3 className="text-sm font-medium text-muted-foreground">Visits</h3>
            <p>{formattedGame.visit_count?.toLocaleString() || 0}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
            <div className="flex items-center">
              <p>{formattedGame.rating_average ? `${formattedGame.rating_average.toFixed(1)}/5` : 'N/A'}</p>
              <span className="text-xs text-muted-foreground ml-2">({formattedGame.rating_count || 0} ratings)</span>
            </div>
          </div>
          
          {/* Display tags if they exist */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Tags</h3>
            <p>
              {hasTags 
                ? game.tags!.join(', ') 
                : hasFeatures 
                  ? formattedGame.features.join(', ')
                  : 'None'}
            </p>
          </div>

          {/* Rating Component */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Rate this game</h3>
            <div className="flex items-center space-x-1 mb-2">
              <GameRating
                gameId={formattedGame.id}
                initialRating={userRating || 0}
                averageRating={formattedGame.rating_average}
                ratingCount={formattedGame.rating_count}
                onRatingSubmitted={handleRateGame}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
