"use server"

import { gameService, Changelog } from '@/services/game-service';

// Create a new changelog
export async function createChangelog(data: { game_id: string; title: string; content: string }): Promise<any> {
  const changelog = {
    title: data.title,
    version: '1.0.0',
    date: new Date().toISOString(),
    content: data.content
  };
  
  const result = await gameService.addChangelog(data.game_id, changelog);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create changelog');
  }
  
  return {
    id: result.changelogId,
    ...changelog
  };
}

// Update an existing changelog
export async function updateChangelog(id: string, data: { game_id: string; title: string; content: string }): Promise<any> {
  const changelog = {
    title: data.title,
    content: data.content,
    date: new Date().toISOString()
  };
  
  const result = await gameService.updateChangelog(data.game_id, id, changelog);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update changelog');
  }
  
  return {
    id,
    ...changelog
  };
}

// Delete a changelog
export async function deleteChangelog(id: string, gameId: string): Promise<void> {
  const result = await gameService.deleteChangelog(gameId, id);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete changelog');
  }
}