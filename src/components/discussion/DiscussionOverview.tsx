import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Swords, HelpCircle, Lightbulb, ChevronDown, Compass, ArrowRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const argdownTypeLabels: Record<string, string> = {
  evidence: 'evidence',
  support: 'supporting argument',
  objection: 'objection',
  alternative: 'alternative',
  concern: 'concern',
  rebuttal: 'rebuttal',
  question: 'open question',
  claim: 'claim',
  proposal: 'proposal',
};

interface Props {
  summary: DiscussionSummaryData;
  tensions: Tension[];
  openQuestions: OpenQuestion[];
  guidance: GuidanceItem[];
}

export default function DiscussionOverview({ summary, tensions, openQuestions, guidance }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { activeFilter, setFilter, scrollToPost, startAssistedComment } = useDiscussion();

  const handleContribute = (item: GuidanceItem) => {
    startAssistedComment({
      guidanceId: item.id,
      targetPostId: item.targetPostId,
      label: item.label,
      description: item.description,
      suggestedArgdownType: item.suggestedArgdownType,
    });
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="glass rounded-lg overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Discussion Insights</span>
            <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">AI-generated</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-5 border-t border-border/50">
            {/* Summary as prose with inline references */}
            <div className="pt-4 space-y-3">
              <p className="text-sm leading-relaxed text-foreground/90">{summary.text}</p>

              {summary.positions.length > 0 && (
                <div className="text-sm leading-relaxed text-foreground/85">
                  <span className="font-semibold text-foreground">Key positions: </span>
                  {summary.positions.map((p, i) => (
                    <span key={p.postId}>
                      {p.authorName} {p.position.charAt(0).toLowerCase() + p.position.slice(1)}
                      <button
                        onClick={() => scrollToPost(p.postId)}
                        className="inline-flex items-center justify-center text-[10px] font-bold text-primary hover:text-primary/80 bg-primary/10 rounded px-1 py-0 mx-0.5 align-baseline transition-colors"
                      >
                        {i + 1}
                      </button>
                      {i < summary.positions.length - 1 ? (i === summary.positions.length - 2 ? ', and ' : ', ') : '.'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tensions & Questions compact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Swords className="h-3 w-3 text-argdown-objection/70" /> Key Tensions
                </h4>
                {tensions.map((t) => {
                  const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                      className={cn(
                        'w-full text-left glass-subtle rounded-lg px-3 py-2.5 text-xs transition-all hover:border-primary/40',
                        isActive && 'ring-2 ring-highlight bg-highlight-bg',
                      )}
                    >
                      <span className="font-medium text-foreground">{t.label}</span>
                      <span className="text-muted-foreground ml-1">· {t.relatedPostIds.length} posts</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-argdown-question" /> Open Questions
                </h4>
                {openQuestions.map((q) => {
                  const isActive = activeFilter?.type === 'question' && activeFilter.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        if (isActive) { setFilter(null); } else {
                          setFilter({ type: 'question', id: q.id, relatedPostIds: q.relatedPostIds });
                          scrollToPost(q.raisedInPostId);
                        }
                      }}
                      className={cn(
                        'w-full text-left glass-subtle rounded-lg px-3 py-2.5 text-xs transition-all hover:border-primary/40',
                        isActive && 'ring-2 ring-highlight bg-highlight-bg',
                      )}
                    >
                      <span className="text-foreground/80">{q.question}</span>
                      {q.raisedBy && <span className="text-muted-foreground/60 block mt-0.5">— {q.raisedBy}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emerging Proposals */}
            {summary.emergingProposals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-argdown-support" /> Emerging Proposals
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {summary.emergingProposals.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                      className="text-left glass-subtle rounded-lg px-3 py-2.5 text-xs transition-all hover:border-primary/40"
                    >
                      <span className="font-medium text-foreground">{ep.title}</span>
                      <span className="text-muted-foreground block mt-0.5">{ep.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Where to Contribute — assisted commenting */}
            <div className="space-y-2 pt-1">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Compass className="h-3 w-3 text-primary" /> Where to Contribute
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {guidance.filter(g => g.type !== 'overrepresented').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleContribute(item)}
                    className="group w-full text-left glass-subtle rounded-lg px-3 py-2.5 text-xs transition-all hover:ring-1 hover:ring-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                        {item.suggestedArgdownType && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-primary/80">
                            Contribute: {argdownTypeLabels[item.suggestedArgdownType] || item.suggestedArgdownType}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
