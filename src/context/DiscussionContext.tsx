import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActiveFilter, AssistedComment } from '@/types/discussion';

interface DiscussionContextType {
  highlightedPostIds: string[];
  activeFilter: ActiveFilter | null;
  scrollToPostId: string | null;
  assistedComment: AssistedComment | null;
  setFilter: (filter: ActiveFilter | null) => void;
  scrollToPost: (postId: string) => void;
  clearScrollTarget: () => void;
  startAssistedComment: (comment: AssistedComment) => void;
  clearAssistedComment: () => void;
}

const DiscussionContext = createContext<DiscussionContextType | undefined>(undefined);

export function DiscussionProvider({ children }: { children: React.ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null);
  const [assistedComment, setAssistedComment] = useState<AssistedComment | null>(null);

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
    if (comment.targetPostId) {
      setScrollToPostId(comment.targetPostId);
    }
  }, []);

  const clearAssistedComment = useCallback(() => {
    setAssistedComment(null);
  }, []);

  const highlightedPostIds = activeFilter?.relatedPostIds ?? [];

  return (
    <DiscussionContext.Provider value={{
      highlightedPostIds, activeFilter, scrollToPostId, assistedComment,
      setFilter, scrollToPost, clearScrollTarget, startAssistedComment, clearAssistedComment,
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
