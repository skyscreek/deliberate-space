import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, ChevronDown } from 'lucide-react';
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
    // This scrolls to the target post AND opens the inline composer there
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
    <div className="surface-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <Sparkles className="h-3 w-3 text-primary/60" />
        <span className="text-[11px] font-medium text-muted-foreground">Discussion Insights</span>
        <span className="text-[9px] text-muted-foreground/40 bg-accent/60 px-1.5 py-0.5 rounded-full">AI</span>
      </div>

      <Accordion type="multiple" defaultValue={["summary"]} className="divide-y divide-border/20">
        {/* Summary */}
        <AccordionItem value="summary" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-[11px] hover:no-underline hover:bg-accent/20">
            <span className="font-medium text-muted-foreground">Summary</span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2.5">
            <p className="text-[13px] leading-relaxed text-foreground/80">{summary.text}</p>
            {summary.positions.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {summary.positions.slice(0, 4).map((p) => (
                  <button
                    key={p.postId}
                    onClick={() => scrollToPost(p.postId)}
                    className="w-full text-left text-[11px] text-muted-foreground/60 hover:text-foreground px-2 py-1 rounded hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-foreground/70 font-medium">{p.authorName}</span> — {p.position.length > 70 ? p.position.slice(0, 70) + '…' : p.position}
                  </button>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Key Tensions */}
        <AccordionItem value="tensions" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-[11px] hover:no-underline hover:bg-accent/20">
            <span className="font-medium text-muted-foreground">Key Tensions <span className="text-muted-foreground/30 ml-1">{tensions.length}</span></span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2.5 space-y-1">
            {tensions.map((t) => {
              const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                  className={cn(
                    'w-full text-left rounded px-2 py-1.5 text-[11px] transition-all hover:bg-accent/30',
                    isActive && 'ring-1 ring-highlight/40 bg-highlight-bg',
                  )}
                >
                  <span className="text-foreground/80 block leading-snug">{t.label}</span>
                  <span className="text-muted-foreground/40 text-[10px]">{t.relatedPostIds.length} posts</span>
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {/* Open Questions */}
        <AccordionItem value="questions" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-[11px] hover:no-underline hover:bg-accent/20">
            <span className="font-medium text-muted-foreground">Open Questions <span className="text-muted-foreground/30 ml-1">{openQuestions.length}</span></span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2.5 space-y-1">
            {openQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => scrollToPost(q.raisedInPostId)}
                className="w-full text-left rounded px-2 py-1.5 text-[11px] hover:bg-accent/30 transition-colors"
              >
                <span className="text-foreground/70 block leading-snug">{q.question}</span>
                {q.raisedBy && <span className="text-muted-foreground/40 text-[10px]">— {q.raisedBy}</span>}
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Emerging Proposals */}
        {summary.emergingProposals.length > 0 && (
          <AccordionItem value="proposals" className="border-0">
            <AccordionTrigger className="px-3 py-2 text-[11px] hover:no-underline hover:bg-accent/20">
              <span className="font-medium text-muted-foreground">Emerging Proposals <span className="text-muted-foreground/30 ml-1">{summary.emergingProposals.length}</span></span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-2.5 space-y-1">
              {summary.emergingProposals.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                  className="w-full text-left rounded px-2 py-1.5 text-[11px] hover:bg-accent/30 transition-colors"
                >
                  <span className="font-medium text-foreground/80 block">{ep.title}</span>
                  <span className="text-muted-foreground/50 block mt-0.5">{ep.description}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Where to Contribute */}
        <AccordionItem value="contribute" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-[11px] hover:no-underline hover:bg-accent/20">
            <span className="font-medium text-primary/70">Where to Contribute <span className="text-muted-foreground/30 ml-1">{actionableGuidance.length}</span></span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2.5">
            <p className="text-[10px] text-muted-foreground/40 mb-1.5">Click to jump to the relevant place and start contributing.</p>
            <div className="space-y-0.5">
              {actionableGuidance.map((item) => {
                const config = guidanceTypeConfig[item.type] || { verb: 'Contribute' };
                return (
                  <button
                    key={item.id}
                    onClick={() => handleContribute(item)}
                    className="w-full text-left flex items-start gap-2 rounded px-2 py-1.5 text-[11px] transition-all hover:bg-primary/5 group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground/80 font-medium block">{item.label}</span>
                      <span className="text-muted-foreground/50 block leading-snug">{item.description}</span>
                    </div>
                    <span className="text-[10px] text-primary/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors">{config.verb} →</span>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
