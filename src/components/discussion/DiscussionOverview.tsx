import { useState } from 'react';
import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, ChevronDown, AlertTriangle, HelpCircle, Lightbulb, Compass } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const guidanceTypeConfig: Record<string, { verb: string }> = {
  'evidence-needed': { verb: 'Add evidence' },
  'missing-perspective': { verb: 'Share perspective' },
  gap: { verb: 'Explore gap' },
  'missing-counterargument': { verb: 'Add counterargument' },
  'missing-alternative': { verb: 'Propose alternative' },
  'unresolved-question': { verb: 'Help resolve' },
  overrepresented: { verb: 'Well covered' },
};

interface Props {
  summary: DiscussionSummaryData;
  tensions: Tension[];
  openQuestions: OpenQuestion[];
  guidance: GuidanceItem[];
}

export default function DiscussionOverview({ summary, tensions, openQuestions, guidance }: Props) {
  const { activeFilter, setFilter, scrollToPost, startAssistedComment } = useDiscussion();

  const handleContribute = (item: GuidanceItem) => {
    startAssistedComment({
      guidanceId: item.id,
      targetPostId: item.targetPostId,
      replyToPostId: item.targetPostId,
      label: item.label,
      description: item.description,
      suggestedArgdownType: item.suggestedArgdownType,
    });
  };

  const actionableGuidance = guidance.filter(g => g.type !== 'overrepresented');

  return (
    <div className="surface-card-elevated overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border/50 hover:bg-accent/20 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--insights-header))' }}>Discussion Insights</span>
        <span className="text-[10px] text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded font-medium">AI</span>
        <ChevronDown className={cn('h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
      <Accordion type="multiple" defaultValue={["summary"]} className="divide-y" style={{ '--tw-divide-color': 'hsl(var(--insights-border))' } as React.CSSProperties}>
        {/* Summary */}
        <AccordionItem value="summary" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="font-semibold text-foreground">Summary</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <p className="text-sm leading-relaxed text-foreground/85">{summary.text}</p>
            {summary.positions.length > 0 && (
              <div className="mt-2.5 space-y-0.5">
                {summary.positions.slice(0, 4).map((p) => (
                  <button
                    key={p.postId}
                    onClick={() => scrollToPost(p.postId)}
                    className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded hover:bg-accent/40 transition-colors"
                  >
                    <span className="text-foreground/80 font-medium">{p.authorName}</span> — {p.position.length > 70 ? p.position.slice(0, 70) + '…' : p.position}
                  </button>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Key Tensions */}
        <AccordionItem value="tensions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle className="h-3 w-3 text-argdown-concern" />
              Key Tensions
              <span className="text-muted-foreground font-normal ml-0.5">{tensions.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 space-y-1">
            {tensions.map((t) => {
              const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                  className={cn(
                    'w-full text-left rounded-md px-2.5 py-2 text-xs transition-all hover:bg-accent/40',
                    isActive && 'ring-1 ring-highlight/50 bg-highlight-bg',
                  )}
                >
                  <span className="text-foreground/90 font-medium block leading-snug">{t.label}</span>
                  <span className="text-muted-foreground text-[11px]">{t.relatedPostIds.length} posts involved</span>
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {/* Open Questions */}
        <AccordionItem value="questions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <HelpCircle className="h-3 w-3 text-argdown-question" />
              Open Questions
              <span className="text-muted-foreground font-normal ml-0.5">{openQuestions.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 space-y-1">
            {openQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => scrollToPost(q.raisedInPostId)}
                className="w-full text-left rounded-md px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors"
              >
                <span className="text-foreground/85 block leading-snug">{q.question}</span>
                {q.raisedBy && <span className="text-muted-foreground text-[11px]">— {q.raisedBy}</span>}
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Emerging Proposals */}
        {summary.emergingProposals.length > 0 && (
          <AccordionItem value="proposals" className="border-0">
            <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Lightbulb className="h-3 w-3 text-argdown-proposal" />
                Emerging Proposals
                <span className="text-muted-foreground font-normal ml-0.5">{summary.emergingProposals.length}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-1">
              {summary.emergingProposals.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                  className="w-full text-left rounded-md px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors"
                >
                  <span className="font-semibold text-foreground/90 block">{ep.title}</span>
                  <span className="text-muted-foreground block mt-0.5 leading-snug">{ep.description}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Where to Contribute */}
        <AccordionItem value="contribute" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <Compass className="h-3 w-3" />
              Where to Contribute
              <span className="text-primary/60 font-normal ml-0.5">{actionableGuidance.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground mb-2">Click to jump to the relevant place and start contributing.</p>
            <div className="space-y-0.5">
              {actionableGuidance.map((item) => {
                const config = guidanceTypeConfig[item.type] || { verb: 'Contribute' };
                return (
                  <button
                    key={item.id}
                    onClick={() => handleContribute(item)}
                    className="w-full text-left flex items-start gap-2 rounded-md px-2.5 py-2 text-xs transition-all hover:bg-primary/5 group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground/90 font-medium block">{item.label}</span>
                      <span className="text-muted-foreground block leading-snug mt-0.5">{item.description}</span>
                    </div>
                    <span className="text-[11px] text-primary/60 group-hover:text-primary shrink-0 mt-0.5 transition-colors font-medium">{config.verb} →</span>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      )}
    </div>
  );
}
