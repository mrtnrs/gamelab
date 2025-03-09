"use client";

import { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { GameComment, gameService } from '@/services/game-service';
import { toast } from 'react-hot-toast';

interface GameCommentsProps {
  gameId: string;
  initialComments: GameComment[];
}

export default function GameComments({ gameId, initialComments }: GameCommentsProps) {
  const [comments, setComments] = useState<GameComment[]>(initialComments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentTextRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const result = await gameService.getComments(gameId);
      setComments(result);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleSubmitComment = async () => {
    if (!gameId || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const result = await gameService.addComment(gameId, commentText.trim());

      if (result.success) {
        toast.success('Comment posted successfully!');
        setCommentText('');
        fetchComments();
      } else {
        toast.error(result.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="md:border-t md:border-border md:pt-12">
      <h2 className="text-2xl font-semibold mb-4">Comments</h2>
      
      {/* Comments List */}
      <div className="space-y-6 mb-8">
        {loadingComments ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-card rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{'Anonymous'}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </div>
              </div>
              <p className="text-foreground">{comment.comment_text}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
      
      {/* Comment Form */}
      <div className="bg-card rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Add a comment</h3>
        <textarea
          ref={commentTextRef}
          className="w-full bg-background border border-input rounded-md p-3 mb-4"
          rows={4}
          placeholder="Share your thoughts about this game..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmittingComment}
        ></textarea>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
          <button
            className={`flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors mb-2 sm:mb-0 ${
              isSubmittingComment ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            onClick={handleSubmitComment}
            disabled={isSubmittingComment}
          >
            <FiSend className="h-4 w-4" />
            <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
          </button>
          <p className="text-xs text-muted-foreground">
            Comments are public and will be visible to all users.
          </p>
        </div>
      </div>
    </div>
  );
}