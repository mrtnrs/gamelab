"use client"

import { useState, useEffect, useRef } from 'react';
import { createChangelog, updateChangelog, deleteChangelog } from '@/actions/changelog-actions';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiCalendar, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Script from 'next/script';

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

// Define Twitter interface for TypeScript
interface TwitterWidgets {
  widgets: {
    load: () => void;
  };
}

// Extend Window interface to include Twitter
declare global {
  interface Window {
    twttr?: TwitterWidgets;
  }
}

interface ChangelogManagerClientProps {
  gameId: string;
  isGameDeveloper: boolean;
  initialChangelogs: ClientChangelog[];
  initialError: string | null | undefined;
}

export default function ChangelogManagerClient({
  gameId,
  isGameDeveloper,
  initialChangelogs,
  initialError,
}: ChangelogManagerClientProps) {
  const [changelogs, setChangelogs] = useState<ClientChangelog[]>(initialChangelogs);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChangelogId, setEditingChangelogId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [expandedChangelogs, setExpandedChangelogs] = useState<Record<string, boolean>>({});
  const [twitterScriptLoaded, setTwitterScriptLoaded] = useState(false);

  // Handle initial error
  useEffect(() => {
    if (initialError) {
      setLoading(false);
      setError(initialError);
    }
  }, [initialError]);

  // Initialize Twitter widgets when script loads or when changelogs expand
  useEffect(() => {
    if (twitterScriptLoaded && typeof window !== 'undefined' && window.twttr) {
      window.twttr.widgets.load();
    }
  }, [twitterScriptLoaded, expandedChangelogs]);

  const handleAddChangelog = () => {
    setTitle('');
    setContent('');
    setVersion('');
    setTweetUrl('');
    setEditingChangelogId(null);
    setIsModalOpen(true);
  };

  const handleEditChangelog = (changelog: ClientChangelog) => {
    setTitle(changelog.title);
    setContent(changelog.content);
    setVersion(changelog.version || '');
    setTweetUrl(changelog.tweet_id ? `https://twitter.com/x/status/${changelog.tweet_id}` : '');
    setEditingChangelogId(changelog.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setContent('');
    setVersion('');
    setTweetUrl('');
    setEditingChangelogId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[handleSubmit] Form submission triggered.");
    e.preventDefault();
    console.log("[handleSubmit] Prevented default form submission.");

    if (!title.trim() || !content.trim()) {
      console.log("[handleSubmit] Validation failed. Title or content empty.");
      setError('Title and content are required');
      return;
    }

    console.log("[handleSubmit] Validation passed. Title and content provided.");
    console.log("[handleSubmit] Title:", title, "Content:", content, "Version:", version, "Tweet URL:", tweetUrl);

    setIsSubmitting(true);
    console.log("[handleSubmit] isSubmitting set to true.");

    // Extract tweet ID from URL if provided
    let tweetId = '';
    if (tweetUrl) {
      console.log("[handleSubmit] Tweet URL provided:", tweetUrl);
      const tweetUrlMatch = tweetUrl.match(/twitter\.com\/\w+\/status\/(\d+)/);
      tweetId = tweetUrlMatch ? tweetUrlMatch[1] : '';
      console.log("[handleSubmit] Extracted tweetId:", tweetId);
    } else {
      console.log("[handleSubmit] No tweet URL provided.");
    }
    
    try {
      if (editingChangelogId) {
        console.log("[handleSubmit] Editing existing changelog with id:", editingChangelogId);
        // Update existing changelog
        const updatedChangelog = await updateChangelog(editingChangelogId, { 
          game_id: gameId,
          title, 
          content
        });
        console.log("[handleSubmit] updateChangelog returned:", updatedChangelog);
        
        setChangelogs(changelogs.map(cl =>
          cl.id === editingChangelogId
            ? { 
                ...cl, 
                title, 
                content,
                updated_at: new Date().toISOString(),
                tweet_id: tweetId || cl.tweet_id
              }
            : cl
        ));
        console.log("[handleSubmit] Updated changelogs state after editing.");
        toast.success('Changelog updated successfully');
        console.log("[handleSubmit] Toast: Changelog updated successfully");
      } else {
        console.log("[handleSubmit] Creating new changelog.");
        // Create new changelog
        const newChangelog = await createChangelog({
          game_id: gameId,
          title,
          content
        });
        console.log("[handleSubmit] createChangelog returned:", newChangelog);
        
        setChangelogs([
          {
            id: newChangelog.id,
            game_id: gameId,
            title,
            content,
            created_at: new Date().toISOString(),
            tweet_id: tweetId,
            version: version || '1.0.0'
          },
          ...changelogs
        ]);
        console.log("[handleSubmit] New changelog added to state.");
        toast.success('Changelog created successfully');
        console.log("[handleSubmit] Toast: Changelog created successfully");
      }
    } catch (err) {
      console.error('[handleSubmit] Error submitting changelog:', err);
      setError('Failed to save changelog');
    } finally {
      setIsSubmitting(false);
      console.log("[handleSubmit] isSubmitting set to false.");
    }
  };

  const handleDeleteChangelog = async (id: string) => {
    console.log("[handleDeleteChangelog] Attempting to delete changelog with id:", id);
    if (!confirm('Are you sure you want to delete this changelog?')) {
      console.log("[handleDeleteChangelog] User cancelled deletion.");
      return;
    }
    
    setLoading(true);
    console.log("[handleDeleteChangelog] Loading set to true.");
    try {
      console.log("[handleDeleteChangelog] Calling deleteChangelog server action for id:", id, "gameId:", gameId);
      // Delete changelog using server action
      await deleteChangelog(id, gameId);
      console.log("[handleDeleteChangelog] deleteChangelog server action completed.");
      setChangelogs(changelogs.filter(cl => cl.id !== id));
      console.log("[handleDeleteChangelog] Updated changelogs state after deletion.");
      toast.success('Changelog deleted');
      console.log("[handleDeleteChangelog] Toast: Changelog deleted successfully.");
    } catch (err) {
      console.error('[handleDeleteChangelog] Error deleting changelog:', err);
      toast.error('Failed to delete changelog');
    } finally {
      setLoading(false);
      console.log("[handleDeleteChangelog] Loading set to false.");
    }
  };

  const toggleChangelogExpansion = (id: string) => {
    setExpandedChangelogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isGameDeveloper && changelogs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {/* Twitter Widget Script */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => setTwitterScriptLoaded(true)}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Changelogs</h2>
        {isGameDeveloper && (
          <button onClick={handleAddChangelog} className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md transition-colors">
            <FiPlus className="h-4 w-4" />
            <span>Add Changelog</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading changelogs...</div>
      ) : changelogs.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          {isGameDeveloper
            ? "No changelogs yet. Add your first changelog to keep players informed about updates!"
            : "No changelogs available for this game."}
        </div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((changelog) => (
            <div key={changelog.id} className="bg-card rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{changelog.title}</h3>
                    {changelog.version && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        v{changelog.version}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleChangelogExpansion(changelog.id)}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    {expandedChangelogs[changelog.id] ? (
                      <>
                        <span>Show less</span>
                        <FiChevronUp className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Show more</span>
                        <FiChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
                {isGameDeveloper && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditChangelog(changelog)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit changelog"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChangelog(changelog.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Delete changelog"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500 mt-1 flex items-center">
                <FiCalendar className="h-3 w-3 mr-1" />
                {new Date(changelog.created_at).toLocaleDateString()}
                {changelog.updated_at && changelog.updated_at !== changelog.created_at &&
                  ` (Updated: ${new Date(changelog.updated_at).toLocaleDateString()})`
                }
              </div>

              <div className={`mt-2 ${!expandedChangelogs[changelog.id] && 'line-clamp-3'}`}>
                {changelog.content}
              </div>
              
              {/* Twitter Embed using blockquote */}
              {changelog.tweet_id && expandedChangelogs[changelog.id] && (
                <div className="mt-4">
                  <blockquote className="twitter-tweet" data-dnt="true">
                    <a href={`https://twitter.com/x/status/${changelog.tweet_id}`}></a>
                  </blockquote>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingChangelogId ? 'Edit Changelog' : 'Add Changelog'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="w-full bg-background border border-input rounded-md p-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., New Features Release"
                  />
                </div>
                
                <div>
                  <label htmlFor="version" className="block text-sm font-medium mb-1">
                    Version
                  </label>
                  <input
                    id="version"
                    type="text"
                    className="w-full bg-background border border-input rounded-md p-2"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 1.2.0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  className="w-full bg-background border border-input rounded-md p-3 min-h-[150px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the changes in this update..."
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="tweetUrl" className="block text-sm font-medium mb-1">
                  Tweet URL
                </label>
                <input
                  id="tweetUrl"
                  type="text"
                  className="w-full bg-background border border-input rounded-md p-2"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="e.g., https://twitter.com/username/status/1234567890"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Add a tweet URL to embed in your changelog
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingChangelogId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}