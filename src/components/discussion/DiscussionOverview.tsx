import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Swords, HelpCircle, Lightbulb, Compass, ArrowRight, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    <div className="surface-card overflow-hidden">
      {/* Static header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Discussion Insights</span>
        <span className="text-[10px] text-muted-foreground/60 bg-accent px-1.5 py-0.5 rounded-full">AI-generated</span>
      </div>

      <Accordion type="multiple" defaultValue={["summary"]} className="divide-y divide-border/30">
        {/* Summary — open by default */}
        <AccordionItem value="summary" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Summary</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <p className="text-sm leading-relaxed text-foreground/85">{summary.text}</p>
            {summary.positions.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Key positions</span>
                {summary.positions.slice(0, 4).map((p, i) => (
                  <button
                    key={p.postId}
                    onClick={() => scrollToPost(p.postId)}
                    className="w-full text-left flex items-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/40 transition-colors group"
                  >
                    <span className="text-[9px] font-bold text-primary/50 mt-0.5 tabular-nums w-3 shrink-0">{i + 1}</span>
                    <span className="text-foreground/70"><strong className="text-foreground">{p.authorName}</strong> — {p.position.length > 80 ? p.position.slice(0, 80) + '…' : p.position}</span>
                  </button>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Key Tensions */}
        <AccordionItem value="tensions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <div className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Key Tensions</span>
              <span className="text-[10px] text-muted-foreground/40 ml-1 normal-case tracking-normal">{tensions.length}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 space-y-1.5">
            {tensions.map((t) => {
              const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                  className={cn(
                    'w-full text-left rounded px-2.5 py-2 text-xs transition-all hover:bg-accent/40',
                    isActive && 'ring-1 ring-highlight/60 bg-highlight-bg',
                  )}
                >
                  <span className="font-medium text-foreground leading-snug block">{t.label}</span>
                  <span className="text-muted-foreground/50 text-[10px] mt-0.5 block">{t.relatedPostIds.length} posts · click to highlight</span>
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {/* Open Questions */}
        <AccordionItem value="questions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</span>
              <span className="text-[10px] text-muted-foreground/40 ml-1 normal-case tracking-normal">{openQuestions.length}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 space-y-1.5">
            {openQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => scrollToPost(q.raisedInPostId)}
                className="w-full text-left rounded px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors"
              >
                <span className="text-foreground/80 leading-snug block">{q.question}</span>
                {q.raisedBy && <span className="text-muted-foreground/50 text-[10px] mt-0.5 block">— {q.raisedBy}</span>}
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Emerging Proposals */}
        {summary.emergingProposals.length > 0 && (
          <AccordionItem value="proposals" className="border-0">
            <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Emerging Proposals</span>
                <span className="text-[10px] text-muted-foreground/40 ml-1 normal-case tracking-normal">{summary.emergingProposals.length}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-1.5">
              {summary.emergingProposals.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                  className="w-full text-left rounded px-2.5 py-2 text-xs hover:bg-accent/40 transition-colors group"
                >
                  <span className="font-medium text-foreground block">{ep.title}</span>
                  <span className="text-muted-foreground/70 block mt-0.5">{ep.description}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Where to Contribute */}
        <AccordionItem value="contribute" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-primary/[0.03]">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-primary/70">Where to Contribute</span>
              <span className="text-[10px] text-muted-foreground/40 ml-1 normal-case tracking-normal">{actionableGuidance.length}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground/60 mb-2">Click to jump to the relevant part and start writing with context.</p>
            <div className="space-y-1">
              {actionableGuidance.map((item) => {
                const config = guidanceTypeConfig[item.type] || { emoji: '💬', verb: 'Contribute' };
                return (
                  <button
                    key={item.id}
                    onClick={() => handleContribute(item)}
                    className="group w-full text-left flex items-start gap-2 rounded px-2.5 py-2 text-xs transition-all hover:bg-primary/5"
                  >
                    <span className="text-sm shrink-0 mt-px">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <p className="text-muted-foreground/70 mt-0.5 leading-snug">{item.description}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
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
