import { useRef, useEffect, useState } from 'react';
import { Post, Reply, ArgdownType } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { ChevronUp, ChevronDown, MessageSquare, CornerDownRight, Compass, X, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const argdownLabels: Record<string, string> = {
  evidence: '📊 Evidence', support: '✅ Support', objection: '❌ Objection',
  alternative: '🔄 Alternative', concern: '⚠️ Concern', rebuttal: '↩️ Rebuttal',
  question: '❓ Question', claim: '💬 Claim', proposal: '💡 Proposal',
};

/* Subtle inline type indicator — no loud badge */
function ArgdownHint({ type }: { type?: ArgdownType }) {
  if (!type) return null;
  const labels: Record<string, string> = {
    claim: 'claim', support: 'support', objection: 'objection', concern: 'concern',
    alternative: 'alternative', question: 'question', proposal: 'proposal',
    evidence: 'evidence', rebuttal: 'rebuttal',
  };
  return (
    <span className="text-[10px] text-muted-foreground/50 italic">
      {labels[type] || type}
    </span>
  );
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

function InlineComposer({ replyToAuthor, replyToExcerpt, assistedComment, onClose }: {
  replyToAuthor: string;
  replyToExcerpt: string;
  assistedComment?: { label: string; description: string; suggestedArgdownType?: ArgdownType } | null;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isAssisted = assistedComment && !assistedComment.label.startsWith('Replying to');

  return (
    <div className="mt-2 rounded-md border border-primary/20 bg-card p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <CornerDownRight className="h-3 w-3 text-primary" />
            <span className="font-medium text-foreground">Replying to {replyToAuthor}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2 italic">"{replyToExcerpt}"</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isAssisted && (
        <div className="rounded-md bg-primary/5 border border-primary/15 px-3 py-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">{assistedComment.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">{assistedComment.description}</p>
          {assistedComment.suggestedArgdownType && (
            <span className="inline-block text-[10px] text-muted-foreground/60 mt-0.5">
              Suggested: {argdownLabels[assistedComment.suggestedArgdownType] || assistedComment.suggestedArgdownType}
            </span>
          )}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder={isAssisted
          ? `Write your ${assistedComment?.suggestedArgdownType || 'contribution'} here…`
          : `Reply to ${replyToAuthor}…`
        }
        className="min-h-[80px] resize-y bg-accent/20 border-border/40 text-sm focus:border-primary/40"
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Auto-classified
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
          <Button size="sm" className="text-xs h-7">Reply</Button>
        </div>
      </div>
    </div>
  );
}

function ReplyBranch({ reply, depth = 0 }: { reply: Reply; depth?: number }) {
  const { startReply, replyingToPostId, assistedComment, clearReply } = useDiscussion();
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = reply.replies && reply.replies.length > 0;
  const isReplying = replyingToPostId === reply.id;

  const handleReply = () => {
    if (isReplying) { clearReply(); } else { startReply(reply.id, reply.author.name, reply.content); }
  };

  return (
    <div className={cn('relative', depth > 0 && 'ml-5')}>
      {depth > 0 && <div className="absolute left-[-13px] top-0 bottom-0 w-px bg-thread-line" />}

      <div className="flex gap-2.5 py-2.5">
        <Avatar name={reply.author.name} color={reply.author.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-semibold text-foreground">{reply.author.name}</span>
            <ArgdownHint type={reply.argdownType} />
            {reply.author.role && <span className="text-muted-foreground/50">· {reply.author.role}</span>}
            <span className="text-muted-foreground/50">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
          </div>

          <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">{reply.content}</p>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
              <span className="font-semibold text-foreground tabular-nums text-[11px]">{reply.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <button
              onClick={handleReply}
              className={cn('flex items-center gap-1 hover:text-foreground transition-colors', isReplying && 'text-primary font-medium')}
            >
              <CornerDownRight className="h-3 w-3" />Reply
            </button>
            {hasChildren && (
              <button onClick={() => setCollapsed(!collapsed)} className="text-primary/60 hover:text-primary">
                {collapsed ? `Show ${reply.replies!.length} replies` : 'Collapse'}
              </button>
            )}
          </div>

          {isReplying && (
            <InlineComposer
              replyToAuthor={reply.author.name}
              replyToExcerpt={reply.content}
              assistedComment={assistedComment?.replyToPostId === reply.id ? assistedComment : null}
              onClose={clearReply}
            />
          )}
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
  const { highlightedPostIds, activeFilter, scrollToPostId, clearScrollTarget, startReply, replyingToPostId, assistedComment, clearReply } = useDiscussion();
  const ref = useRef<HTMLDivElement>(null);
  const [showReplies, setShowReplies] = useState(true);

  const isHighlighted = highlightedPostIds.includes(post.id);
  const isDimmed = activeFilter !== null && !isHighlighted;
  const isReplying = replyingToPostId === post.id;

  useEffect(() => {
    if (scrollToPostId === post.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearScrollTarget();
    }
  }, [scrollToPostId, post.id, clearScrollTarget]);

  const handleReply = () => {
    if (isReplying) { clearReply(); } else { startReply(post.id, post.author.name, post.content); }
  };

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
                <ArgdownHint type={post.argdownType} />
                {post.author.role && (
                  <span className="text-xs text-muted-foreground/50">{post.author.role}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground/50">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-foreground">{post.content}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.replies.length > 0 ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}` : 'Replies'}
            </button>
            <button
              onClick={handleReply}
              className={cn('flex items-center gap-1 hover:text-foreground transition-colors', isReplying && 'text-primary font-medium')}
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>

          {isReplying && (
            <InlineComposer
              replyToAuthor={post.author.name}
              replyToExcerpt={post.content}
              assistedComment={assistedComment?.targetPostId === post.id || assistedComment?.replyToPostId === post.id ? assistedComment : null}
              onClose={clearReply}
            />
          )}

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
