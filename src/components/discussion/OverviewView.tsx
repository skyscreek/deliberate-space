import { Topic } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Users, Swords, HelpCircle, Lightbulb, ArrowRight, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  topic: Topic;
}

export default function OverviewView({ topic }: Props) {
  const { activeFilter, setFilter, scrollToPost } = useDiscussion();

  const { summary, tensions, openQuestions, clusters } = topic;

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="surface-card px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          A structured overview of the entire discussion, showing the current state of positions, tensions, open questions, and emerging proposals.
        </p>
      </div>

      {/* Summary */}
      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discussion Summary</h3>
          </div>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-sm leading-relaxed text-foreground/85">{summary.text}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{topic.participantCount} participants</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />{topic.postCount} posts</span>
            <span className="flex items-center gap-1"><Swords className="h-3.5 w-3.5" />{tensions.length} tensions</span>
            <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" />{openQuestions.length} open questions</span>
          </div>
        </div>
      </div>

      {/* Key Positions */}
      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Positions</h3>
            <span className="text-[10px] text-muted-foreground/50 ml-1">{summary.positions.length} identified</span>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {summary.positions.map((p, i) => (
            <button
              key={p.postId}
              onClick={() => scrollToPost(p.postId)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group"
            >
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5 tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{p.authorName}</span>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.position}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Tensions */}
      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
          <div className="flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-argdown-objection/60" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Tensions</h3>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {tensions.map((t) => {
            const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-accent/30 transition-all',
                  isActive && 'bg-highlight-bg ring-1 ring-inset ring-highlight/40',
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground/50">{t.relatedPostIds.length} posts</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md bg-argdown-support/5 border border-argdown-support/15 px-2.5 py-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-argdown-support/70 block mb-0.5">Side A</span>
                    <span className="text-xs text-foreground/80 leading-snug">{t.sideA}</span>
                  </div>
                  <div className="rounded-md bg-argdown-objection/5 border border-argdown-objection/15 px-2.5 py-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-argdown-objection/70 block mb-0.5">Side B</span>
                    <span className="text-xs text-foreground/80 leading-snug">{t.sideB}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Open Questions + Clusters side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Open Questions */}
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-argdown-question/70" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</h3>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {openQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => scrollToPost(q.raisedInPostId)}
                className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <p className="text-xs text-foreground/80 leading-snug">{q.question}</p>
                {q.raisedBy && <span className="text-[10px] text-muted-foreground/50 mt-1 block">— {q.raisedBy}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Clusters */}
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic Clusters</h3>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {clusters.map((c) => {
              const isActive = activeFilter?.type === 'cluster' && activeFilter.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => isActive ? setFilter(null) : setFilter({ type: 'cluster', id: c.id, relatedPostIds: c.relatedPostIds })}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-accent/30 transition-all',
                    isActive && 'bg-highlight-bg',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{c.postCount} posts</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-snug">{c.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emerging Proposals */}
      {topic.emergingProposals.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-accent/20">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-argdown-proposal/70" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emerging Proposals</h3>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {topic.emergingProposals.map((ep) => (
              <button
                key={ep.id}
                onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{ep.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ep.description}</p>
                    <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                      Supported by {ep.supportedBy.join(', ')}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
