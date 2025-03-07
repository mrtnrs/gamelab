"use client"

import { useState, useEffect } from 'react'
import { gameService, Changelog } from '@/services/game-service'
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

interface ChangelogManagerProps {
  gameId: string
  claimed: boolean
}

export default function ChangelogManager({ gameId, claimed }: ChangelogManagerProps) {
  const [changelogs, setChangelogs] = useState<Changelog[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingChangelogId, setEditingChangelogId] = useState<string | null>(null)
  const [expandedChangelogs, setExpandedChangelogs] = useState<Set<string>>(new Set())
  
  // Form state
  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [date, setDate] = useState('')
  const [content, setContent] = useState('')
  
  // Fetch changelogs
  useEffect(() => {
    const fetchChangelogs = async () => {
      setLoading(true)
      try {
        const data = await gameService.getChangelogs(gameId)
        // Sort changelogs by date (newest first)
        const sortedChangelogs = [...data].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setChangelogs(sortedChangelogs)
      } catch (error) {
        console.error('Error fetching changelogs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChangelogs()
  }, [gameId])
  
  const handleAddChangelog = () => {
    setTitle('')
    setVersion('')
    setDate(new Date().toISOString().split('T')[0]) // Default to today
    setContent('')
    setEditingChangelogId(null)
    setIsModalOpen(true)
  }
  
  const handleEditChangelog = (changelog: Changelog) => {
    setTitle(changelog.title)
    setVersion(changelog.version)
    setDate(new Date(changelog.date).toISOString().split('T')[0])
    setContent(changelog.content)
    setEditingChangelogId(changelog.id)
    setIsModalOpen(true)
  }
  
  const handleDeleteChangelog = async (changelogId: string) => {
    if (!confirm('Are you sure you want to delete this changelog?')) {
      return
    }
    
    try {
      const result = await gameService.deleteChangelog(gameId, changelogId)
      
      if (result.success) {
        toast.success('Changelog deleted successfully')
        setChangelogs(changelogs.filter(cl => cl.id !== changelogId))
      } else {
        toast.error(result.error || 'Failed to delete changelog')
      }
    } catch (error) {
      console.error('Error deleting changelog:', error)
      toast.error('An error occurred while deleting the changelog')
    }
  }
  
  const handleSubmit = async () => {
    if (!title.trim() || !version.trim() || !date || !content.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (editingChangelogId) {
        // Update existing changelog
        const result = await gameService.updateChangelog(
          gameId,
          editingChangelogId,
          { title, version, date, content }
        )
        
        if (result.success) {
          toast.success('Changelog updated successfully')
          
          // Update the changelogs list
          setChangelogs(changelogs.map(cl => 
            cl.id === editingChangelogId 
              ? { ...cl, title, version, date, content } 
              : cl
          ))
          
          setIsModalOpen(false)
        } else {
          toast.error(result.error || 'Failed to update changelog')
        }
      } else {
        // Add new changelog
        const result = await gameService.addChangelog(
          gameId,
          { title, version, date, content }
        )
        
        if (result.success && result.changelogId) {
          toast.success('Changelog added successfully')
          
          // Add the new changelog to the list
          const newChangelog: Changelog = {
            id: result.changelogId,
            title,
            version,
            date,
            content
          }
          
          // Add to beginning of array (newest first)
          setChangelogs([newChangelog, ...changelogs])
          
          setIsModalOpen(false)
        } else {
          toast.error(result.error || 'Failed to add changelog')
        }
      }
    } catch (error) {
      console.error('Error saving changelog:', error)
      toast.error('An error occurred while saving the changelog')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const toggleExpand = (changelogId: string) => {
    const newExpanded = new Set(expandedChangelogs)
    if (newExpanded.has(changelogId)) {
      newExpanded.delete(changelogId)
    } else {
      newExpanded.add(changelogId)
    }
    setExpandedChangelogs(newExpanded)
  }
  
  // For standard users, if there are no changelogs, nothing should be visible
  if (!claimed && changelogs.length === 0) {
    return null
  }
  
  // Process content to embed X.com posts
  const processContent = (content: string) => {
    // Regular expression to match X.com/Twitter URLs
    const twitterRegex = /(https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+(\?\S*)?)/g;
    
    // Split content by Twitter URLs
    const parts = content.split(twitterRegex);
    
    if (parts.length <= 1) {
      // No Twitter URLs found, return the original content
      return content;
    }
    
    // Reconstruct content with embedded tweets
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // This is regular text
        result.push(parts[i]);
      } else {
        // This is a Twitter URL, create an embedded tweet
        const tweetUrl = parts[i];
        result.push(
          `<div class="tweet-embed my-4">
            <blockquote class="twitter-tweet">
              <a href="${tweetUrl}"></a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </div>`
        );
      }
    }
    
    return result.join('');
  };
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Changelogs</h3>
        {/* Always show the Add Changelog button for testing */}
        <button
          onClick={handleAddChangelog}
          className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Changelog</span>
        </button>
      </div>
      
      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-pulse">Loading changelogs...</div>
        </div>
      ) : changelogs.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No changelogs yet. Click "Add Changelog" to create the first one!
        </div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((changelog) => (
            <div key={changelog.id} className="border border-border rounded-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-accent cursor-pointer"
                onClick={() => toggleExpand(changelog.id)}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{changelog.title}</h3>
                    <span className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      v{changelog.version}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(changelog.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center">
                  {/* Always show edit/delete buttons for testing */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditChangelog(changelog)
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit changelog"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChangelog(changelog.id)
                    }}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete changelog"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                  {expandedChangelogs.has(changelog.id) ? (
                    <FiChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {expandedChangelogs.has(changelog.id) && (
                <div 
                  className="p-4 border-t border-border"
                  dangerouslySetInnerHTML={{ __html: processContent(changelog.content) }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Changelog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingChangelogId ? 'Edit Changelog' : 'Add New Changelog'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Major Update"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="version" className="block text-sm font-medium mb-1">
                  Version
                </label>
                <input
                  type="text"
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.2.0"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the changes in this update... You can also paste X.com post URLs to embed them."
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use plain text. Line breaks will be preserved. X.com post URLs will be automatically embedded.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changelog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
