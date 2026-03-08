import { useRef, useEffect, useState } from 'react';
import { Post, Reply, ArgdownType } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { ChevronUp, ChevronDown, MessageSquare, CornerDownRight, X, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const argdownColors: Partial<Record<ArgdownType, string>> = {
  claim: 'text-argdown-claim',
  support: 'text-argdown-support',
  objection: 'text-argdown-objection',
  concern: 'text-argdown-concern',
  alternative: 'text-argdown-alternative',
  question: 'text-argdown-question',
  proposal: 'text-argdown-proposal',
  evidence: 'text-argdown-support',
  rebuttal: 'text-argdown-objection',
};

function ArgdownHint({ type }: { type?: ArgdownType }) {
  if (!type) return null;
  return (
    <span className={cn('text-[10px] italic font-medium', argdownColors[type] || 'text-muted-foreground')}>
      {type}
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

function InlineComposer({ replyToAuthor, replyToExcerpt, assistedComment, onClose }: {
  replyToAuthor: string;
  replyToExcerpt: string;
  assistedComment?: { label: string; description: string; suggestedArgdownType?: ArgdownType } | null;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  const isAssisted = assistedComment && !assistedComment.label.startsWith('Replying to');

  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3" />
            <span>Replying to <span className="text-foreground font-medium">{replyToAuthor}</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 italic">"{replyToExcerpt}"</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isAssisted && (
        <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2 space-y-0.5">
          <p className="text-xs font-semibold text-foreground">{assistedComment.label}</p>
          <p className="text-xs text-muted-foreground leading-snug">{assistedComment.description}</p>
          {assistedComment.suggestedArgdownType && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Suggested type: <span className={cn('font-medium', argdownColors[assistedComment.suggestedArgdownType])}>{assistedComment.suggestedArgdownType}</span></p>
          )}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder={isAssisted ? `Write your ${assistedComment?.suggestedArgdownType || 'contribution'}…` : `Reply to ${replyToAuthor}…`}
        className="min-h-[70px] resize-y bg-card border-border/60 text-sm focus:border-primary/40"
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
        <Button size="sm" className="text-xs h-7">Reply</Button>
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
    if (isReplying) clearReply(); else startReply(reply.id, reply.author.name, reply.content);
  };

  return (
    <div className={cn('relative', depth > 0 && 'ml-5')}>
      {depth > 0 && <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-thread-line" />}

      <div className="flex gap-2.5 py-2">
        <Avatar name={reply.author.name} color={reply.author.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-foreground">{reply.author.name}</span>
            <ArgdownHint type={reply.argdownType} />
            <span className="text-muted-foreground">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{reply.content}</p>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
              <span className="font-semibold text-foreground/70 tabular-nums text-[11px]">{reply.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={handleReply} className={cn('hover:text-foreground transition-colors font-medium', isReplying && 'text-primary')}>Reply</button>
            {hasChildren && (
              <button onClick={() => setCollapsed(!collapsed)} className="text-primary/60 hover:text-primary font-medium">
                {collapsed ? `+${reply.replies!.length} replies` : '−'}
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
        <div>{reply.replies!.map((child) => <ReplyBranch key={child.id} reply={child} depth={depth + 1} />)}</div>
      )}
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const { highlightedPostIds, activeFilter, scrollToPostId, clearScrollTarget, startReply, replyingToPostId, assistedComment, clearReply } = useDiscussion();
  const ref = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showReplies, setShowReplies] = useState(post.replies.length <= 2);

  const isHighlighted = highlightedPostIds.includes(post.id);
  const isDimmed = activeFilter !== null && !isHighlighted;
  const isReplying = replyingToPostId === post.id;

  useEffect(() => {
    if (scrollToPostId === post.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearScrollTarget();
      setCollapsed(false);
      setShowReplies(true);
    }
  }, [scrollToPostId, post.id, clearScrollTarget]);

  const handleReply = () => {
    if (isReplying) clearReply(); else startReply(post.id, post.author.name, post.content);
  };

  return (
    <div
      ref={ref}
      id={`post-${post.id}`}
      className={cn(
        'surface-card-elevated transition-all duration-300',
        isHighlighted && 'ring-2 ring-highlight/50 bg-highlight-bg',
        isDimmed && 'opacity-30',
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Author line + collapse toggle */}
        <div className="flex items-start gap-3">
          <Avatar name={post.author.name} color={post.author.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{post.author.name}</span>
              <ArgdownHint type={post.argdownType} />
              {post.author.role && <span className="text-xs text-muted-foreground">{post.author.role}</span>}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Vote + collapse */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-4 w-4" /></button>
              <span className="text-xs font-bold text-foreground/70 tabular-nums">{post.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-90')} />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{post.content}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {post.replies.length > 0
                  ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}`
                  : 'No replies'}
              </button>
              <button
                onClick={handleReply}
                className={cn('font-medium hover:text-foreground transition-colors', isReplying && 'text-primary')}
              >
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
              <div className="mt-3 ml-1 border-l-2 border-thread-line pl-4">
                {post.replies.map((reply) => <ReplyBranch key={reply.id} reply={reply} depth={0} />)}
              </div>
            )}
          </>
        )}

        {collapsed && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{post.content}</p>
        )}
      </div>
    </div>
  );
}
