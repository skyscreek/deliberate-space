import { useRef, useEffect, useState } from 'react';
import { Post, Reply, ArgdownType } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { ChevronUp, ChevronDown, MessageSquare, CornerDownRight, X, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function ArgdownHint({ type }: { type?: ArgdownType }) {
  if (!type) return null;
  return (
    <span className="text-[10px] text-muted-foreground/40 italic">{type}</span>
  );
}

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const dim = size === 'sm' ? 'h-5 w-5 text-[8px]' : 'h-7 w-7 text-[9px]';
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
    <div className="mt-2 rounded-md border border-border/60 bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3" />
            <span>Replying to <span className="text-foreground font-medium">{replyToAuthor}</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 line-clamp-1 italic">"{replyToExcerpt}"</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isAssisted && (
        <div className="rounded bg-accent/60 px-2.5 py-2 space-y-0.5">
          <p className="text-[11px] font-medium text-foreground">{assistedComment.label}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{assistedComment.description}</p>
          {assistedComment.suggestedArgdownType && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Suggested type: {assistedComment.suggestedArgdownType}</p>
          )}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder={isAssisted ? `Write your ${assistedComment?.suggestedArgdownType || 'contribution'}…` : `Reply to ${replyToAuthor}…`}
        className="min-h-[70px] resize-y bg-accent/20 border-border/40 text-sm"
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
    <div className={cn('relative', depth > 0 && 'ml-4')}>
      {depth > 0 && <div className="absolute left-[-10px] top-0 bottom-0 w-px bg-thread-line" />}

      <div className="flex gap-2 py-1.5">
        <Avatar name={reply.author.name} color={reply.author.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="font-medium text-foreground">{reply.author.name}</span>
            <ArgdownHint type={reply.argdownType} />
            <span className="text-muted-foreground/40">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
          </div>

          <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/85">{reply.content}</p>

          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/50">
            <div className="flex items-center gap-0.5">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-3 w-3" /></button>
              <span className="font-medium text-foreground/60 tabular-nums">{reply.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-3 w-3" /></button>
            </div>
            <button onClick={handleReply} className={cn('hover:text-foreground transition-colors', isReplying && 'text-primary')}>Reply</button>
            {hasChildren && (
              <button onClick={() => setCollapsed(!collapsed)} className="text-primary/50 hover:text-primary">
                {collapsed ? `+${reply.replies!.length}` : '−'}
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
      // Auto-expand if collapsed
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
        'surface-card transition-all duration-300',
        isHighlighted && 'ring-1 ring-highlight/40 bg-highlight-bg',
        isDimmed && 'opacity-30',
      )}
    >
      <div className="p-3 sm:p-4">
        {/* Author line + collapse toggle */}
        <div className="flex items-start gap-2.5">
          <Avatar name={post.author.name} color={post.author.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{post.author.name}</span>
              <ArgdownHint type={post.argdownType} />
              {post.author.role && <span className="text-[11px] text-muted-foreground/40">{post.author.role}</span>}
            </div>
            <span className="text-[11px] text-muted-foreground/40">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Vote + collapse */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 text-muted-foreground/50">
              <button className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
              <span className="text-xs font-medium text-foreground/60 tabular-nums">{post.score}</span>
              <button className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', !collapsed && 'rotate-90')} />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{post.content}</p>

            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground/50">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                {post.replies.length > 0
                  ? `${post.replies.length} ${post.replies.length === 1 ? 'reply' : 'replies'}`
                  : 'No replies'}
              </button>
              <button
                onClick={handleReply}
                className={cn('hover:text-foreground transition-colors', isReplying && 'text-primary')}
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
              <div className="mt-2 ml-1 border-l border-thread-line pl-3">
                {post.replies.map((reply) => <ReplyBranch key={reply.id} reply={reply} depth={0} />)}
              </div>
            )}
          </>
        )}

        {collapsed && (
          <p className="mt-1 text-[12px] text-muted-foreground/40 line-clamp-1">{post.content}</p>
        )}
      </div>
    </div>
  );
}
