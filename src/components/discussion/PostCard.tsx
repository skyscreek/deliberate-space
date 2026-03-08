import { useRef, useEffect, useState } from 'react';
import { Post } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import ReplyCard from './ReplyCard';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const reactionEmoji = { support: '👍', nuance: '🤔', disagree: '❗' };

export default function PostCard({ post }: { post: Post }) {
  const { highlightedPostIds, activeFilter, scrollToPostId, clearScrollTarget } = useDiscussion();
  const ref = useRef<HTMLDivElement>(null);
  const [showReplies, setShowReplies] = useState(post.replies.length > 0);

  const isHighlighted = highlightedPostIds.includes(post.id);
  const isDimmed = activeFilter !== null && !isHighlighted;

  useEffect(() => {
    if (scrollToPostId === post.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearScrollTarget();
    }
  }, [scrollToPostId, post.id, clearScrollTarget]);

  return (
    <div ref={ref} id={`post-${post.id}`} className={cn(
      'rounded-lg border bg-card p-4 transition-all duration-300',
      isHighlighted && 'ring-2 ring-amber-400 bg-amber-50/40 dark:bg-amber-950/20',
      isDimmed && 'opacity-40',
    )}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{post.author.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{post.author.name}</span>
            {post.author.role && <span className="text-xs text-muted-foreground">{post.author.role}</span>}
            <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{post.content}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {post.reactions.map((r) => (
              <button key={r.type} className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
                <span>{reactionEmoji[r.type]}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.replies.length > 0 ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>
          </div>
          {showReplies && post.replies.length > 0 && (
            <div className="mt-3 space-y-2 border-l-2 border-muted pl-4">
              {post.replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
