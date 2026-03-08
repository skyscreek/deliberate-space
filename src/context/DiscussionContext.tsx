import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActiveFilter, AssistedComment } from '@/types/discussion';

interface DiscussionContextType {
  highlightedPostIds: string[];
  activeFilter: ActiveFilter | null;
  scrollToPostId: string | null;
  assistedComment: AssistedComment | null;
  replyingToPostId: string | null;
  setFilter: (filter: ActiveFilter | null) => void;
  scrollToPost: (postId: string) => void;
  clearScrollTarget: () => void;
  startAssistedComment: (comment: AssistedComment) => void;
  clearAssistedComment: () => void;
  startReply: (postId: string, authorName: string, excerpt: string) => void;
  clearReply: () => void;
}

const DiscussionContext = createContext<DiscussionContextType | undefined>(undefined);

export function DiscussionProvider({ children }: { children: React.ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null);
  const [assistedComment, setAssistedComment] = useState<AssistedComment | null>(null);
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);

  const setFilter = useCallback((filter: ActiveFilter | null) => {
    setActiveFilter(filter);
  }, []);

  const scrollToPost = useCallback((postId: string) => {
    setScrollToPostId(postId);
  }, []);

  const clearScrollTarget = useCallback(() => {
    setScrollToPostId(null);
  }, []);

  const startAssistedComment = useCallback((comment: AssistedComment) => {
    setAssistedComment(comment);
    // Set reply target: use replyToPostId first, fallback to targetPostId
    const targetId = comment.replyToPostId || comment.targetPostId || null;
    setReplyingToPostId(targetId);
    // Scroll to the target post
    if (targetId) {
      setScrollToPostId(targetId);
    }
  }, []);

  const clearAssistedComment = useCallback(() => {
    setAssistedComment(null);
    setReplyingToPostId(null);
  }, []);

  const startReply = useCallback((postId: string, authorName: string, excerpt: string) => {
    setReplyingToPostId(postId);
    setAssistedComment({
      guidanceId: `reply-${postId}`,
      replyToPostId: postId,
      replyToAuthor: authorName,
      replyToExcerpt: excerpt,
      label: `Replying to ${authorName}`,
      description: excerpt.length > 120 ? excerpt.slice(0, 120) + '…' : excerpt,
      suggestedArgdownType: undefined,
    });
  }, []);

  const clearReply = useCallback(() => {
    setReplyingToPostId(null);
    setAssistedComment(null);
  }, []);

  const highlightedPostIds = activeFilter?.relatedPostIds ?? [];

  return (
    <DiscussionContext.Provider value={{
      highlightedPostIds, activeFilter, scrollToPostId, assistedComment, replyingToPostId,
      setFilter, scrollToPost, clearScrollTarget, startAssistedComment, clearAssistedComment,
      startReply, clearReply,
    }}>
      {children}
    </DiscussionContext.Provider>
  );
}

export function useDiscussion() {
  const ctx = useContext(DiscussionContext);
  if (!ctx) throw new Error('useDiscussion must be used within DiscussionProvider');
  return ctx;
}
