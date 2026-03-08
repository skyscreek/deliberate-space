import { DiscussionSummaryData, Tension, OpenQuestion } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Swords, HelpCircle, Lightbulb, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  summary: DiscussionSummaryData;
  tensions: Tension[];
  openQuestions: OpenQuestion[];
}

export default function DiscussionOverview({ summary, tensions, openQuestions }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { activeFilter, setFilter, scrollToPost } = useDiscussion();

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="rounded-lg border bg-card shadow-sm">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Discussion Overview</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">AI-generated</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t">
            <p className="text-sm leading-relaxed text-foreground/90 pt-3">{summary.text}</p>

            {summary.positions.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Key Positions</h4>
                <div className="space-y-0.5">
                  {summary.positions.map((p) => (
                    <button
                      key={p.postId}
                      onClick={() => scrollToPost(p.postId)}
                      className="flex items-start gap-2 w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-secondary/50 transition-colors"
                    >
                      <span className="text-muted-foreground shrink-0 mt-0.5">→</span>
                      <span><strong className="text-foreground">{p.authorName}</strong> <span className="text-muted-foreground">— {p.position}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Swords className="h-3 w-3 text-destructive/70" /> Tensions
                </h4>
                {tensions.map((t) => {
                  const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                      className={cn(
                        'w-full text-left rounded-md border px-2.5 py-2 text-xs transition-all hover:border-primary/40',
                        isActive && 'border-highlight bg-highlight-bg ring-1 ring-highlight',
                      )}
                    >
                      <span className="font-medium text-foreground">{t.label}</span>
                      <span className="text-muted-foreground ml-1">· {t.relatedPostIds.length} posts</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-highlight" /> Open Questions
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
                        'w-full text-left rounded-md border px-2.5 py-2 text-xs transition-all hover:border-primary/40',
                        isActive && 'border-highlight bg-highlight-bg ring-1 ring-highlight',
                      )}
                    >
                      <span className="text-foreground/80">{q.question}</span>
                      {q.raisedBy && <span className="text-muted-foreground/60 block mt-0.5">— {q.raisedBy}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-vote-up" /> Emerging Proposals
                </h4>
                {summary.emergingProposals.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                    className="w-full text-left rounded-md border px-2.5 py-2 text-xs transition-all hover:border-primary/40"
                  >
                    <span className="font-medium text-foreground">{ep.title}</span>
                    <span className="text-muted-foreground block mt-0.5">{ep.description}</span>
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
