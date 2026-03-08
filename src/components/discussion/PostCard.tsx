import { useRef, useEffect, useState } from 'react';
import { Post, Reply, ArgdownType } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { ChevronUp, ChevronDown, MessageSquare, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const argdownConfig: Record<string, { label: string; color: string; bg: string }> = {
  claim:       { label: 'Claim',       color: 'text-argdown-claim',       bg: 'bg-argdown-claim/10' },
  support:     { label: 'Support',     color: 'text-argdown-support',     bg: 'bg-argdown-support/10' },
  objection:   { label: 'Objection',   color: 'text-argdown-objection',   bg: 'bg-argdown-objection/10' },
  concern:     { label: 'Concern',     color: 'text-argdown-concern',     bg: 'bg-argdown-concern/10' },
  alternative: { label: 'Alternative', color: 'text-argdown-alternative', bg: 'bg-argdown-alternative/10' },
  question:    { label: 'Question',    color: 'text-argdown-question',    bg: 'bg-argdown-question/10' },
  proposal:    { label: 'Proposal',    color: 'text-argdown-proposal',    bg: 'bg-argdown-proposal/10' },
  evidence:    { label: 'Evidence',    color: 'text-argdown-support',     bg: 'bg-argdown-support/10' },
  rebuttal:    { label: 'Rebuttal',    color: 'text-argdown-objection',   bg: 'bg-argdown-objection/10' },
};

function ArgdownBadge({ type }: { type?: ArgdownType }) {
  if (!type) return null;
  const config = argdownConfig[type];
  if (!config) return null;
  return (
    <span className={cn('argdown-badge', config.color, config.bg)}>
      {config.label}
    </span>
  );
}

function UserAvatar({ author, size = 'md' }: { author: Post['author']; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[10px]';
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-primary-foreground shrink-0', dim)}
      style={{ backgroundColor: `hsl(${author.color})` }}
    >
      {author.avatar}
    </div>
  );
}

function VoteColumn({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 pt-1 min-w-[2rem]">
      <button className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-vote-up">
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-foreground tabular-nums">{score}</span>
      <button className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-vote-down">
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

const reactionEmoji = { support: '👍', nuance: '🤔', disagree: '❗' };

function ReplyBranch({ reply, depth = 0 }: { reply: Reply; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = reply.replies && reply.replies.length > 0;

  return (
    <div className={cn('relative', depth > 0 && 'ml-4')}>
      <div className="absolute left-3 top-8 bottom-0 w-px bg-thread-line" />

      <div className="flex gap-2.5 pt-2.5">
        <div className="flex flex-col items-center shrink-0">
          <UserAvatar author={reply.author} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{reply.author.name}</span>
            <ArgdownBadge type={reply.argdownType} />
            {reply.author.role && <span className="text-[10px] text-muted-foreground">{reply.author.role}</span>}
            <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{reply.content}</p>

          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button className="p-0 text-muted-foreground hover:text-vote-up transition-colors">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-bold text-foreground tabular-nums">{reply.score}</span>
              <button className="p-0 text-muted-foreground hover:text-vote-down transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {reply.reactions.filter(r => r.count > 0).map((r) => (
              <button key={r.type} className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <span>{reactionEmoji[r.type]}</span>
                <span>{r.count}</span>
              </button>
            ))}
            <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <CornerDownRight className="h-3 w-3" />Reply
            </button>
            {hasChildren && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-[10px] text-primary hover:underline"
              >
                {collapsed ? `Show ${reply.replies!.length} replies` : 'Collapse'}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div className="ml-3">
          {reply.replies!.map((child) => (
            <ReplyBranch key={child.id} reply={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const { highlightedPostIds, activeFilter, scrollToPostId, clearScrollTarget } = useDiscussion();
  const ref = useRef<HTMLDivElement>(null);
  const [showReplies, setShowReplies] = useState(true);

  const isHighlighted = highlightedPostIds.includes(post.id);
  const isDimmed = activeFilter !== null && !isHighlighted;

  useEffect(() => {
    if (scrollToPostId === post.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearScrollTarget();
    }
  }, [scrollToPostId, post.id, clearScrollTarget]);

  return (
    <div
      ref={ref}
      id={`post-${post.id}`}
      className={cn(
        'glass rounded-lg transition-all duration-300',
        isHighlighted && 'ring-2 ring-highlight bg-highlight-bg',
        isDimmed && 'opacity-35',
      )}
    >
      <div className="flex">
        {/* Vote column */}
        <div className="border-r border-border/50 bg-accent/20 px-1 py-3 rounded-l-lg">
          <VoteColumn score={post.score} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <UserAvatar author={post.author} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{post.author.name}</span>
                <ArgdownBadge type={post.argdownType} />
                {post.author.role && (
                  <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded-full">{post.author.role}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground">{post.content}</p>

          <div className="mt-3 flex items-center gap-3 flex-wrap border-t border-border/50 pt-2.5">
            {post.reactions.filter(r => r.count > 0).map((r) => (
              <button key={r.type} className="flex items-center gap-1 rounded-full border border-border/50 bg-accent/30 px-2.5 py-1 text-xs hover:bg-accent transition-colors">
                <span>{reactionEmoji[r.type]}</span>
                <span className="text-muted-foreground font-medium">{r.count}</span>
              </button>
            ))}
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto font-medium"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.replies.length > 0 ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>
          </div>

          {showReplies && post.replies.length > 0 && (
            <div className="mt-2 relative">
              {post.replies.map((reply) => (
                <ReplyBranch key={reply.id} reply={reply} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
