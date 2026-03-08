import { useRef, useEffect, useState } from 'react';
import { Post, Reply, ArgdownType } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { ChevronUp, ChevronDown, MessageSquare, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const argdownConfig: Record<string, { label: string; className: string }> = {
  claim:       { label: 'Claim',       className: 'text-argdown-claim bg-argdown-claim/10' },
  support:     { label: 'Support',     className: 'text-argdown-support bg-argdown-support/10' },
  objection:   { label: 'Objection',   className: 'text-argdown-objection bg-argdown-objection/10' },
  concern:     { label: 'Concern',     className: 'text-argdown-concern bg-argdown-concern/10' },
  alternative: { label: 'Alt',         className: 'text-argdown-alternative bg-argdown-alternative/10' },
  question:    { label: 'Question',    className: 'text-argdown-question bg-argdown-question/10' },
  proposal:    { label: 'Proposal',    className: 'text-argdown-proposal bg-argdown-proposal/10' },
  evidence:    { label: 'Evidence',    className: 'text-argdown-support bg-argdown-support/10' },
  rebuttal:    { label: 'Rebuttal',    className: 'text-argdown-objection bg-argdown-objection/10' },
};

function ArgdownBadge({ type }: { type?: ArgdownType }) {
  if (!type) return null;
  const c = argdownConfig[type];
  if (!c) return null;
  return <span className={cn('argdown-badge', c.className)}>{c.label}</span>;
}

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[10px]';
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-primary-foreground shrink-0', dim)}
      style={{ backgroundColor: `hsl(${color})` }}
    >
      {initials}
    </div>
  );
}

function VoteColumn({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 pt-0.5">
      <button className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-vote-up">
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-foreground tabular-nums leading-none">{score}</span>
      <button className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-vote-down">
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

function ReplyBranch({ reply, depth = 0 }: { reply: Reply; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = reply.replies && reply.replies.length > 0;

  return (
    <div className={cn('relative', depth > 0 && 'ml-5')}>
      {/* Thread line */}
      {depth > 0 && (
        <div className="absolute left-[-13px] top-0 bottom-0 w-px bg-thread-line" />
      )}

      <div className="flex gap-2.5 py-2.5">
        <Avatar name={reply.author.name} color={reply.author.color} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-semibold text-foreground">{reply.author.name}</span>
            <ArgdownBadge type={reply.argdownType} />
            {reply.author.role && <span className="text-muted-foreground">· {reply.author.role}</span>}
            <span className="text-muted-foreground">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
          </div>

          <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">{reply.content}</p>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
              <span className="font-semibold text-foreground tabular-nums text-[11px]">{reply.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <CornerDownRight className="h-3 w-3" />Reply
            </button>
            {hasChildren && (
              <button onClick={() => setCollapsed(!collapsed)} className="text-primary hover:underline">
                {collapsed ? `Show ${reply.replies!.length} replies` : 'Collapse'}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div>
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
        'surface-card transition-all duration-300',
        isHighlighted && 'ring-2 ring-highlight/60 bg-highlight-bg',
        isDimmed && 'opacity-35',
      )}
    >
      <div className="flex">
        {/* Vote column */}
        <div className="flex items-start justify-center px-2 py-3 bg-accent/30 border-r border-border/40 rounded-l-lg">
          <VoteColumn score={post.score} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4">
          {/* Author line */}
          <div className="flex items-center gap-2.5">
            <Avatar name={post.author.name} color={post.author.color} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{post.author.name}</span>
                <ArgdownBadge type={post.argdownType} />
                {post.author.role && (
                  <span className="text-xs text-muted-foreground">{post.author.role}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Post body */}
          <p className="mt-3 text-[13px] leading-relaxed text-foreground">{post.content}</p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.replies.length > 0 ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>

          {/* Replies */}
          {showReplies && post.replies.length > 0 && (
            <div className="mt-2 ml-1 border-l-2 border-thread-line pl-3">
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
