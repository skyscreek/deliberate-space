import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useTopic } from '@/hooks/useTopics';
import { usePosts, useCreatePost, useVote, PostRow } from '@/hooks/usePosts';
import { useAuth } from '@/context/AuthContext';
import { DiscussionProvider, useDiscussion } from '@/context/DiscussionContext';
import { ArrowLeft, MessageSquare, Sparkles, Loader2, ChevronUp, ChevronDown, Plus, Minus, X, CornerDownRight, Tag } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, ChevronDown as ChevDown } from 'lucide-react';
import { ArgdownType } from '@/types/discussion';
import DeliberationPanel from '@/components/deliberation/DeliberationPanel';
import { useAnalysis, AIAnalysis } from '@/hooks/useAnalysis';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import OverviewView from '@/components/discussion/OverviewView';
import ArgumentMapView from '@/components/discussion/ArgumentMapView';
import { Topic, ArgumentNode, Tension, ArgumentCluster, OpenQuestion, GuidanceItem, DiscussionSummaryData, EmergingProposal } from '@/types/discussion';

const argdownColors: Partial<Record<string, string>> = {
  claim: 'text-argdown-claim', support: 'text-argdown-support', objection: 'text-argdown-objection',
  concern: 'text-argdown-concern', alternative: 'text-argdown-alternative', question: 'text-argdown-question',
  proposal: 'text-argdown-proposal', evidence: 'text-argdown-support', rebuttal: 'text-argdown-objection',
};

const argdownBgColors: Partial<Record<string, string>> = {
  claim: 'bg-argdown-claim/10 text-argdown-claim border-argdown-claim/30',
  support: 'bg-argdown-support/10 text-argdown-support border-argdown-support/30',
  objection: 'bg-argdown-objection/10 text-argdown-objection border-argdown-objection/30',
  concern: 'bg-argdown-concern/10 text-argdown-concern border-argdown-concern/30',
  alternative: 'bg-argdown-alternative/10 text-argdown-alternative border-argdown-alternative/30',
  question: 'bg-argdown-question/10 text-argdown-question border-argdown-question/30',
  proposal: 'bg-argdown-proposal/10 text-argdown-proposal border-argdown-proposal/30',
  evidence: 'bg-argdown-support/10 text-argdown-support border-argdown-support/30',
  rebuttal: 'bg-argdown-objection/10 text-argdown-objection border-argdown-objection/30',
};

const ALL_ARGDOWN_TYPES: ArgdownType[] = ['claim', 'support', 'objection', 'concern', 'alternative', 'question', 'proposal', 'evidence', 'rebuttal'];

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[10px]';
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-primary-foreground bg-primary shrink-0', dim)}>
      {initials}
    </div>
  );
}

function CollapseToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0">
      {collapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
    </button>
  );
}

function ThreadLine({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex justify-center w-6 flex-1 shrink-0 cursor-pointer py-0.5 min-h-[24px]" aria-label="Collapse thread">
      <div className="w-0.5 h-full bg-border/80 group-hover:bg-foreground/50 transition-colors rounded-full" />
    </button>
  );
}

function ArgdownTypePicker({ value, onChange }: { value: ArgdownType | null; onChange: (v: ArgdownType | null) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border transition-colors',
          value ? argdownBgColors[value] : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
        )}
      >
        <Tag className="h-3 w-3" />
        {value || 'Tag type'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 left-0 z-50 bg-card border border-border rounded-lg shadow-lg p-1.5 min-w-[140px]">
            {value && (
              <button
                className="w-full text-left text-[10px] px-2 py-1 rounded text-muted-foreground hover:bg-accent/40 transition-colors mb-0.5"
                onClick={() => { onChange(null); setOpen(false); }}
              >
                Clear tag
              </button>
            )}
            {ALL_ARGDOWN_TYPES.map(t => (
              <button
                key={t}
                className={cn(
                  'w-full text-left text-[10px] font-medium px-2 py-1 rounded transition-colors',
                  value === t ? 'bg-accent/60' : 'hover:bg-accent/40',
                  argdownColors[t],
                )}
                onClick={() => { onChange(t); setOpen(false); }}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InlineComposer({ replyToAuthor, replyToExcerpt, topicId, parentPostId, onClose }: {
  replyToAuthor: string; replyToExcerpt: string; topicId: string; parentPostId: string; onClose: () => void;
}) {
  const [content, setContent] = useState('');
  const [argdownType, setArgdownType] = useState<ArgdownType | null>(null);
  const createPost = useCreatePost();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ topicId, content, parentPostId, argdownType: argdownType || undefined });
      setContent('');
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3" />
            <span>Replying to <span className="text-foreground font-medium">{replyToAuthor}</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 italic">"{replyToExcerpt.slice(0, 120)}"</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={`Reply to ${replyToAuthor}…`}
        className="min-h-[70px] resize-y bg-card border-border/60 text-sm focus:border-primary/40"
        autoFocus
      />
      <div className="flex items-center justify-between gap-2">
        <ArgdownTypePicker value={argdownType} onChange={setArgdownType} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
          <Button size="sm" className="text-xs h-7" onClick={handleSubmit} disabled={createPost.isPending || !content.trim()}>
            {createPost.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReplyNode({ post, topicId, depth = 0 }: { post: PostRow; topicId: string; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const vote = useVote();
  const { user } = useAuth();
  const { toast } = useToast();
  const { highlightedPostIds, scrollToPostId, clearScrollTarget } = useDiscussion();
  const ref = useRef<HTMLDivElement>(null);
  const authorName = post.author_profile?.display_name || 'Unknown';
  const hasChildren = post.children && post.children.length > 0;
  const isHighlighted = highlightedPostIds.length > 0 && highlightedPostIds.includes(post.id);
  const isDimmed = highlightedPostIds.length > 0 && !highlightedPostIds.includes(post.id);

  useEffect(() => {
    if (scrollToPostId === post.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearScrollTarget();
    }
  }, [scrollToPostId, post.id, clearScrollTarget]);

  const handleVote = (value: 1 | -1) => {
    if (!user) { toast({ title: 'Sign in to vote', variant: 'destructive' }); return; }
    vote.mutate({ postId: post.id, value, topicId });
  };

  const totalDesc = (p: PostRow): number => (p.children || []).reduce((sum, c) => sum + 1 + totalDesc(c), 0);

  return (
    <div
      ref={ref}
      className={cn(
        'flex transition-all duration-300',
        isHighlighted && 'bg-highlight-bg/40 -mx-2 px-2 rounded-md ring-1 ring-highlight/30',
        isDimmed && 'opacity-40',
      )}
    >
      <div className="flex flex-col items-center w-6 shrink-0">
        {collapsed ? (
          <div className="pt-1"><CollapseToggle collapsed onClick={() => setCollapsed(false)} /></div>
        ) : (
          <>
            <div className="pt-1"><Avatar name={authorName} size="sm" /></div>
            <ThreadLine onClick={() => setCollapsed(true)} />
          </>
        )}
      </div>
      <div className="flex-1 min-w-0 pl-2">
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span className="font-semibold text-foreground/70">{authorName}</span>
            <span>· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            {hasChildren && <span className="text-primary/60 font-medium">+{totalDesc(post) + 1} comments</span>}
          </button>
        ) : (
          <>
            <div className="py-1.5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Link to={`/profile/${post.author_id}`} className="font-semibold text-foreground hover:text-primary transition-colors">{authorName}</Link>
                {post.argdown_type && (
                  <span className={cn('text-[10px] italic font-medium', argdownColors[post.argdown_type] || 'text-muted-foreground')}>
                    {post.argdown_type}
                  </span>
                )}
                <span className="text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{post.content}</p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleVote(1)} className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <span className="font-semibold text-foreground/70 tabular-nums text-[11px]">{post.score}</span>
                  <button onClick={() => handleVote(-1)} className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => setReplying(!replying)} className={cn('hover:text-foreground transition-colors font-medium', replying && 'text-primary')}>Reply</button>
              </div>
              {replying && (
                <InlineComposer
                  replyToAuthor={authorName}
                  replyToExcerpt={post.content}
                  topicId={topicId}
                  parentPostId={post.id}
                  onClose={() => setReplying(false)}
                />
              )}
            </div>
            {hasChildren && (
              <div>
                {post.children!.map(child => <ReplyNode key={child.id} post={child} topicId={topicId} depth={depth + 1} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const PostCard = forwardRef<HTMLDivElement, { post: PostRow; topicId: string }>(({ post, topicId }, forwardedRef) => {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const vote = useVote();
  const { user } = useAuth();
  const { toast } = useToast();
  const { highlightedPostIds, scrollToPostId, clearScrollTarget } = useDiscussion();
  const localRef = useRef<HTMLDivElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || localRef;
  const authorName = post.author_profile?.display_name || 'Unknown';
  const hasChildren = post.children && post.children.length > 0;
  const isHighlighted = highlightedPostIds.length > 0 && highlightedPostIds.includes(post.id);
  const isDimmed = highlightedPostIds.length > 0 && !highlightedPostIds.includes(post.id);

  useEffect(() => {
    if (scrollToPostId === post.id) {
      const el = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearScrollTarget();
      }
    }
  }, [scrollToPostId, post.id, clearScrollTarget, ref]);

  const handleVote = (value: 1 | -1) => {
    if (!user) { toast({ title: 'Sign in to vote', variant: 'destructive' }); return; }
    vote.mutate({ postId: post.id, value, topicId });
  };

  const totalReplies = (p: PostRow): number => (p.children || []).reduce((sum, c) => sum + 1 + totalReplies(c), 0);

  return (
    <div
      ref={localRef}
      className={cn(
        'surface-card-elevated transition-all duration-300',
        isHighlighted && 'ring-2 ring-highlight/50 shadow-md shadow-highlight/10',
        isDimmed && 'opacity-40',
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex">
          <div className="flex flex-col items-center w-8 shrink-0">
            {collapsed ? (
              <div className="pt-0.5"><CollapseToggle collapsed onClick={() => setCollapsed(false)} /></div>
            ) : (
              <>
                <Avatar name={authorName} />
                <ThreadLine onClick={() => setCollapsed(true)} />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0 pl-2.5">
            {collapsed ? (
              <button onClick={() => setCollapsed(false)} className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span className="font-semibold text-foreground/70">{authorName}</span>
                <span>· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {hasChildren && <span className="text-primary/60 font-medium">+{totalReplies(post)} comments</span>}
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/profile/${post.author_id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{authorName}</Link>
                  {post.argdown_type && (
                    <span className={cn('text-[10px] italic font-medium', argdownColors[post.argdown_type] || 'text-muted-foreground')}>
                      {post.argdown_type}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{post.content}</p>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleVote(1)} className="hover:text-vote-up transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <span className="text-xs font-bold text-foreground/70 tabular-nums">{post.score}</span>
                    <button onClick={() => handleVote(-1)} className="hover:text-vote-down transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => setReplying(!replying)} className={cn('font-medium hover:text-foreground transition-colors flex items-center gap-1', replying && 'text-primary')}>
                    <MessageSquare className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
                {replying && (
                  <InlineComposer
                    replyToAuthor={authorName}
                    replyToExcerpt={post.content}
                    topicId={topicId}
                    parentPostId={post.id}
                    onClose={() => setReplying(false)}
                  />
                )}
                {hasChildren && (
                  <div className="mt-3">
                    {post.children!.map(child => <ReplyNode key={child.id} post={child} topicId={topicId} depth={0} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
PostCard.displayName = 'PostCard';

function TopLevelComposer({ topicId }: { topicId: string }) {
  const [content, setContent] = useState('');
  const [argdownType, setArgdownType] = useState<ArgdownType | null>(null);
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { toast } = useToast();
  const { assistedComment, clearAssistedComment } = useDiscussion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When assisted comment is set (from guidance), update state
  useEffect(() => {
    if (assistedComment && !assistedComment.replyToPostId) {
      if (assistedComment.suggestedArgdownType) {
        setArgdownType(assistedComment.suggestedArgdownType);
      }
      textareaRef.current?.focus();
    }
  }, [assistedComment]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) { toast({ title: 'Sign in to post', variant: 'destructive' }); return; }
    try {
      await createPost.mutateAsync({ topicId, content, argdownType: argdownType || undefined });
      setContent('');
      setArgdownType(null);
      clearAssistedComment();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const guidanceContext = assistedComment && !assistedComment.replyToPostId ? assistedComment : null;

  return (
    <div className="surface-card-elevated p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Add your contribution</h3>
      
      {guidanceContext && (
        <div className="flex items-start gap-2 p-2.5 rounded-md border border-primary/20 bg-primary/[0.03]">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{guidanceContext.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{guidanceContext.description}</p>
          </div>
          <button onClick={clearAssistedComment} className="text-muted-foreground hover:text-foreground p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Share your perspective, evidence, or questions…"
        className="min-h-[100px] resize-y bg-accent/30 border-border/60 focus:border-primary/40"
      />
      <div className="flex items-center justify-between">
        <ArgdownTypePicker value={argdownType} onChange={setArgdownType} />
        <Button size="sm" onClick={handleSubmit} disabled={createPost.isPending || !content.trim()}>
          {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
        </Button>
      </div>
    </div>
  );
}

function TopicHeaderLive({ topic }: { topic: { title: string; description: string; proposal: string | null; category: string; status: string; author_id: string; author_profile?: { display_name: string }; created_at: string; post_count?: number; participant_count?: number } }) {
  const [open, setOpen] = useState(true);
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'text-vote-up font-semibold' },
    'seeking-consensus': { label: 'Seeking Consensus', className: 'text-highlight font-semibold' },
    resolved: { label: 'Resolved', className: 'text-primary font-semibold' },
  };
  const status = statusConfig[topic.status] || statusConfig.active;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="surface-card-elevated overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/20 transition-colors">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-primary font-semibold">{topic.category}</span>
            <span className="text-border">·</span>
            <span className={cn('text-xs', status.className)}>{status.label}</span>
          </div>
          <ChevDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-4 pt-1 space-y-3 border-t border-border/40">
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug">{topic.title}</h1>
            {topic.proposal && topic.proposal.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-1.5 last:mb-0">{para}</p>
            ))}
            {!topic.proposal && topic.description && (
              <p className="text-sm leading-relaxed text-foreground/80">{topic.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <Link to={`/profile/${topic.author_id}`} className="font-medium text-foreground/80 hover:text-primary transition-colors">{topic.author_profile?.display_name || 'Unknown'}</Link>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participant_count ?? 0}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.post_count ?? 0} posts</span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** Build a mock Topic object from live DB data + AI analysis for Overview/ArgMap views */
function buildTopicForViews(
  topic: { title: string; description: string; proposal: string | null; category: string; status: string; author_id: string; author_profile?: { display_name: string }; created_at: string },
  posts: PostRow[] | undefined,
  analysis: AIAnalysis | null,
): Topic {
  const tensions: Tension[] = analysis?.tensions?.map(t => ({
    id: t.id, label: t.label, sideA: t.sideA, sideB: t.sideB, relatedPostIds: t.relatedPostIds,
  })) ?? [];

  const clusters: ArgumentCluster[] = analysis?.clusters?.map(c => ({
    id: c.id, name: c.name, description: c.description, postCount: c.postCount, relatedPostIds: c.relatedPostIds,
  })) ?? [];

  const openQuestions: OpenQuestion[] = analysis?.open_questions?.map(q => ({
    id: q.id, question: q.question, raisedInPostId: q.raisedInPostId, raisedBy: q.raisedBy, relatedPostIds: q.relatedPostIds,
  })) ?? [];

  const guidance: GuidanceItem[] = (analysis?.guidance ?? []).map(g => ({
    id: g.id, type: g.type as GuidanceItem['type'], label: g.label, description: g.description,
    targetPostId: g.targetPostId, suggestedArgdownType: g.suggestedArgdownType as GuidanceItem['suggestedArgdownType'],
  }));

  const summary: DiscussionSummaryData = {
    text: analysis?.summary ?? 'No analysis available yet. Click "Analyze" to generate insights.',
    positions: [], tensions, openQuestions, emergingProposals: [],
  };

  // Build argument map from classifications + posts
  const argumentMap: ArgumentNode[] = [];
  if (analysis?.classifications && posts) {
    const postMap = new Map(posts.map(p => [p.id, p]));
    const rootPosts = posts.filter(p => !p.parent_post_id);
    
    function buildNode(post: PostRow, depth: number): ArgumentNode {
      const classification = analysis!.classifications?.find(c => c.postId === post.id);
      const nodeType = (classification?.suggestedType || post.argdown_type || 'claim') as ArgumentNode['type'];
      const validTypes = ['claim', 'support', 'objection', 'concern', 'alternative', 'question', 'proposal'];
      
      return {
        id: `arg-${post.id}`,
        type: validTypes.includes(nodeType) ? nodeType : 'claim',
        text: post.content.length > 200 ? post.content.slice(0, 200) + '…' : post.content,
        author: post.author_profile?.display_name || 'Unknown',
        relatedPostIds: [post.id],
        status: 'unresolved',
        strength: classification?.confidence,
        children: (post.children || []).map(c => buildNode(c, depth + 1)),
      };
    }
    
    rootPosts.forEach(p => argumentMap.push(buildNode(p, 0)));
  }

  const author = { id: topic.author_id, name: topic.author_profile?.display_name || 'Unknown', avatar: '', color: '' };
  const postCount = posts?.length ?? 0;

  return {
    id: 'live', title: topic.title, category: topic.category, status: topic.status as Topic['status'],
    author, createdAt: topic.created_at, lastActivity: topic.created_at,
    participantCount: new Set(posts?.map(p => p.author_id)).size, postCount,
    proposal: topic.proposal || topic.description,
    posts: [], tensions, clusters, openQuestions, guidance, summary,
    emergingProposals: [], argumentMap,
  };
}

function DiscussionContent() {
  const { slug } = useParams();
  const { data: topic, isLoading: topicLoading } = useTopic(slug);
  const topicId = topic?.id;
  const { data: posts, isLoading: postsLoading } = usePosts(topicId);
  const { data: analysisData } = useAnalysis(topicId);
  const [activeTab, setActiveTab] = useState('discussion');
  const [argMapFilter, setArgMapFilter] = useState<string | undefined>();
  const { scrollToPost } = useDiscussion();

  if (topicLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="text-sm text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  const topicForViews = buildTopicForViews(topic, posts, analysisData?.analysis ?? null);

  return (
    <div className="space-y-5">
      <TopicHeaderLive topic={{ ...topic, post_count: posts?.length, participant_count: topicForViews.participantCount }} />
      
      <DeliberationPanel topicId={topicId!} postCount={posts?.length ?? 0} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="discussion" className="flex-1">Discussion</TabsTrigger>
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="argument-map" className="flex-1">Argument Map</TabsTrigger>
        </TabsList>

        <TabsContent value="discussion">
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {posts?.map(post => (
                <PostCard key={post.id} post={post} topicId={topicId!} />
              ))}
              {posts?.length === 0 && (
                <div className="surface-card-elevated p-8 text-center">
                  <p className="text-sm text-muted-foreground">No posts yet. Be the first to contribute!</p>
                </div>
              )}
            </div>
          )}
          <TopLevelComposer topicId={topicId!} />
        </TabsContent>

        <TabsContent value="overview">
          {!analysisData?.analysis ? (
            <div className="surface-card-elevated p-8 text-center">
              <p className="text-sm text-muted-foreground">No analysis available yet. Click "Analyze" above to generate discussion insights.</p>
            </div>
          ) : (
            <OverviewView
              topic={topicForViews}
              onSwitchToThread={(postId) => { setActiveTab('discussion'); setTimeout(() => scrollToPost(postId), 100); }}
              onSwitchToArgType={(type) => { setArgMapFilter(type); setActiveTab('argument-map'); }}
            />
          )}
        </TabsContent>

        <TabsContent value="argument-map">
          {topicForViews.argumentMap.length === 0 ? (
            <div className="surface-card-elevated p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {analysisData?.analysis ? 'No argument structure found.' : 'Run an analysis first to generate the argument map.'}
              </p>
            </div>
          ) : (
            <ArgumentMapView
              nodes={topicForViews.argumentMap}
              onSwitchToThread={(postId) => { setActiveTab('discussion'); setTimeout(() => scrollToPost(postId), 100); }}
              initialFilter={argMapFilter}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Discussion() {
  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-background">
        <header className="glass-strong sticky top-0 z-30 border-b">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Delibera</span>
            </Link>
            <div className="ml-auto"><UserMenu /></div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-5">
          <DiscussionContent />
        </main>
      </div>
    </DiscussionProvider>
  );
}
