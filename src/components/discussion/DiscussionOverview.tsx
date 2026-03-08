import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Swords, HelpCircle, Lightbulb, ChevronDown, Compass, ArrowRight, Users, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const guidanceTypeConfig: Record<string, { emoji: string; verb: string }> = {
  'evidence-needed': { emoji: '📊', verb: 'Add evidence' },
  'missing-perspective': { emoji: '👥', verb: 'Share perspective' },
  gap: { emoji: '💡', verb: 'Explore gap' },
  'missing-counterargument': { emoji: '⚖️', verb: 'Add counterargument' },
  'missing-alternative': { emoji: '🔄', verb: 'Propose alternative' },
  'unresolved-question': { emoji: '❓', verb: 'Help resolve' },
  overrepresented: { emoji: '⚠️', verb: 'Well covered' },
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

  const actionableGuidance = guidance.filter(g => g.type !== 'overrepresented');

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="surface-card overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Discussion Insights</span>
            <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">AI-generated</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/40">

            {/* 1. Summary */}
            <section className="px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</h4>
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{summary.text}</p>
            </section>

            <div className="border-t border-border/30 mx-4" />

            {/* 2. Key Positions */}
            <section className="px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key Positions</h4>
                <span className="text-[10px] text-muted-foreground/60 ml-1">{summary.positions.length} identified</span>
              </div>
              <div className="space-y-1.5">
                {summary.positions.map((p, i) => (
                  <button
                    key={p.postId}
                    onClick={() => scrollToPost(p.postId)}
                    className="w-full text-left flex items-start gap-2 rounded-md px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors group"
                  >
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold shrink-0 mt-0.5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-foreground">{p.authorName}</span>
                      <span className="text-foreground/70"> {p.position.charAt(0).toLowerCase() + p.position.slice(1)}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </section>

            <div className="border-t border-border/30 mx-4" />

            {/* 3. Tensions & Open Questions — side by side */}
            <section className="px-4 py-3.5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Tensions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Swords className="h-3.5 w-3.5 text-argdown-objection/60" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key Tensions</h4>
                  </div>
                  <div className="space-y-1.5">
                    {tensions.map((t) => {
                      const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                          className={cn(
                            'w-full text-left rounded-md px-2.5 py-2 text-xs transition-all hover:bg-accent/40',
                            isActive && 'ring-1 ring-highlight/60 bg-highlight-bg',
                          )}
                        >
                          <span className="font-medium text-foreground block leading-snug">{t.label}</span>
                          <span className="text-muted-foreground/60 text-[10px] mt-0.5 block">{t.relatedPostIds.length} posts · click to highlight</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Open Questions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <HelpCircle className="h-3.5 w-3.5 text-argdown-question/70" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</h4>
                  </div>
                  <div className="space-y-1.5">
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
                            'w-full text-left rounded-md px-2.5 py-2 text-xs transition-all hover:bg-accent/40',
                            isActive && 'ring-1 ring-highlight/60 bg-highlight-bg',
                          )}
                        >
                          <span className="text-foreground/80 block leading-snug">{q.question}</span>
                          {q.raisedBy && <span className="text-muted-foreground/50 text-[10px] mt-0.5 block">— {q.raisedBy}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t border-border/30 mx-4" />

            {/* 4. Emerging Proposals */}
            {summary.emergingProposals.length > 0 && (
              <>
                <section className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Lightbulb className="h-3.5 w-3.5 text-argdown-proposal/70" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emerging Proposals</h4>
                  </div>
                  <div className="space-y-1.5">
                    {summary.emergingProposals.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                        className="w-full text-left rounded-md px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground block leading-snug">{ep.title}</span>
                            <span className="text-muted-foreground/70 block mt-0.5">{ep.description}</span>
                            <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                              Supported by {ep.supportedBy.join(', ')}
                            </span>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="border-t border-border/30 mx-4" />
              </>
            )}

            {/* 5. Where to Contribute */}
            <section className="px-4 py-3.5 bg-primary/[0.02]">
              <div className="flex items-center gap-1.5 mb-1">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">Where to Contribute</h4>
                <span className="text-[10px] text-muted-foreground/60 ml-1">{actionableGuidance.length} opportunities</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mb-3">Click to jump to the relevant part of the discussion and start writing with context.</p>

              <div className="space-y-1">
                {actionableGuidance.map((item) => {
                  const config = guidanceTypeConfig[item.type] || { emoji: '💬', verb: 'Contribute' };
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleContribute(item)}
                      className="group w-full text-left flex items-start gap-2.5 rounded-md px-2.5 py-2.5 text-xs transition-all hover:bg-primary/5 hover:ring-1 hover:ring-primary/20"
                    >
                      <span className="text-sm shrink-0 mt-px">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.label}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/60 bg-primary/8 rounded-full px-1.5 py-px">
                            {config.verb}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
