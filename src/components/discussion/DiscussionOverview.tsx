import { DiscussionSummaryData, Tension, OpenQuestion } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Swords, HelpCircle, Lightbulb, ChevronDown, User } from 'lucide-react';
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
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Discussion Overview</span>
            <span className="text-xs text-muted-foreground">· AI-generated summary</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t">
            {/* Summary text */}
            <p className="text-sm leading-relaxed text-foreground/85 pt-3">{summary.text}</p>

            {/* Key positions */}
            {summary.positions.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Positions</h4>
                <div className="space-y-1">
                  {summary.positions.map((p) => (
                    <button
                      key={p.postId}
                      onClick={() => scrollToPost(p.postId)}
                      className="flex items-start gap-2 w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <User className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      <span><strong className="text-foreground">{p.authorName}</strong> <span className="text-muted-foreground">— {p.position}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tensions + Open Questions + Proposals in a compact grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Tensions */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
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
                        isActive && 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400',
                      )}
                    >
                      <span className="font-medium text-foreground">{t.label}</span>
                      <span className="text-muted-foreground/60 ml-1">· {t.relatedPostIds.length} posts</span>
                    </button>
                  );
                })}
              </div>

              {/* Open Questions */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-amber-500" /> Open Questions
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
                        isActive && 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400',
                      )}
                    >
                      <span className="text-foreground/80">{q.question}</span>
                      {q.raisedBy && <span className="text-muted-foreground/60 block mt-0.5">— {q.raisedBy}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Emerging Proposals */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-emerald-500" /> Emerging Proposals
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
