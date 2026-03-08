import { useState } from 'react';
import { DiscussionSummaryData, Tension, OpenQuestion, GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, ChevronDown, AlertTriangle, HelpCircle, Lightbulb, Compass, ArrowRight, Swords, MessageCircleQuestion } from 'lucide-react';
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

/** Renders summary text with inline [linked references](@postId) */
function SummaryText({ text, onClickRef }: { text: string; onClickRef: (postId: string) => void }) {
  const parts = text.split(/(\[[^\]]+\]\(@[^)]+\))/g);
  return (
    <p className="text-sm leading-relaxed text-foreground/85">
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(@([^)]+)\)$/);
        if (match) {
          return (
            <button
              key={i}
              onClick={() => onClickRef(match[2])}
              className="text-primary/80 hover:text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors"
            >
              {match[1]}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

/** Tension card: "Side A  vs  Side B" layout */
function TensionItem({ tension, isActive, onToggle }: { tension: Tension; isActive: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full text-left rounded-lg border transition-all hover:shadow-sm',
        isActive
          ? 'ring-2 ring-argdown-concern/30 border-argdown-concern/40 bg-argdown-concern/5'
          : 'border-border/60 hover:border-argdown-concern/30 bg-card',
      )}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
          <Swords className="h-3 w-3 text-argdown-concern" />
          <span className="font-medium uppercase tracking-wider">Tension</span>
          <span className="ml-auto">{tension.relatedPostIds.length} posts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs font-medium text-foreground/90 text-center bg-accent/50 rounded px-2 py-1.5 leading-snug">
            {tension.sideA}
          </span>
          <span className="text-[10px] font-bold text-argdown-concern shrink-0">vs</span>
          <span className="flex-1 text-xs font-medium text-foreground/90 text-center bg-accent/50 rounded px-2 py-1.5 leading-snug">
            {tension.sideB}
          </span>
        </div>
      </div>
    </button>
  );
}

/** Question card: styled as a question with ? icon */
function QuestionItem({ question, onClick }: { question: OpenQuestion; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-argdown-question/20 bg-argdown-question/5 hover:border-argdown-question/40 transition-all hover:shadow-sm px-3 py-2.5 group"
    >
      <div className="flex items-start gap-2">
        <MessageCircleQuestion className="h-4 w-4 text-argdown-question shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground/90 leading-snug">{question.question}</p>
          {question.raisedBy && (
            <span className="text-[11px] text-muted-foreground mt-1 block">Asked by {question.raisedBy}</span>
          )}
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-argdown-question shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  );
}

/** Proposal card: distinct with lightbulb and supporters */
function ProposalItem({ proposal, onClick }: { proposal: { id: string; title: string; description: string; supportedBy: string[]; relatedPostIds: string[] }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-argdown-proposal/20 bg-argdown-proposal/5 hover:border-argdown-proposal/40 transition-all hover:shadow-sm px-3 py-2.5 group"
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-argdown-proposal shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground/90">{proposal.title}</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{proposal.description}</p>
          {proposal.supportedBy.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-argdown-proposal/80">
              <span className="font-medium">Supported by:</span>
              <span className="text-muted-foreground">{proposal.supportedBy.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function DiscussionOverview({ summary, tensions, openQuestions, guidance }: Props) {
  const { activeFilter, setFilter, scrollToPost, startAssistedComment } = useDiscussion();
  const [open, setOpen] = useState(true);

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
      <Accordion type="multiple" defaultValue={["summary"]} className="divide-y divide-border/50">
        {/* Summary */}
        <AccordionItem value="summary" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="font-semibold text-foreground">Summary</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <SummaryText text={summary.text} onClickRef={scrollToPost} />
          </AccordionContent>
        </AccordionItem>

        {/* Key Tensions — "sideA vs sideB" cards */}
        <AccordionItem value="tensions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle className="h-3 w-3 text-argdown-concern" />
              Key Tensions
              <span className="text-muted-foreground font-normal ml-0.5">{tensions.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-2">
              {tensions.map((t) => {
                const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
                return (
                  <TensionItem
                    key={t.id}
                    tension={t}
                    isActive={isActive}
                    onToggle={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
                  />
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Open Questions — question-mark styled cards */}
        <AccordionItem value="questions" className="border-0">
          <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <HelpCircle className="h-3 w-3 text-argdown-question" />
              Open Questions
              <span className="text-muted-foreground font-normal ml-0.5">{openQuestions.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {openQuestions.map((q) => (
                <QuestionItem key={q.id} question={q} onClick={() => scrollToPost(q.raisedInPostId)} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Emerging Proposals — lightbulb styled cards */}
        {summary.emergingProposals.length > 0 && (
          <AccordionItem value="proposals" className="border-0">
            <AccordionTrigger className="px-4 py-2.5 text-xs hover:no-underline hover:bg-accent/30">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Lightbulb className="h-3 w-3 text-argdown-proposal" />
                Emerging Proposals
                <span className="text-muted-foreground font-normal ml-0.5">{summary.emergingProposals.length}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-2">
                {summary.emergingProposals.map((ep) => (
                  <ProposalItem
                    key={ep.id}
                    proposal={ep}
                    onClick={() => ep.relatedPostIds[0] && scrollToPost(ep.relatedPostIds[0])}
                  />
                ))}
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionableGuidance.map((item) => {
                const config = guidanceTypeConfig[item.type] || { verb: 'Contribute' };
                return (
                  <button
                    key={item.id}
                    onClick={() => handleContribute(item)}
                    className="w-full text-left flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/[0.03] hover:border-primary/30 hover:bg-primary/5 px-3 py-2.5 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground/90 block">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground block leading-snug mt-0.5">{item.description}</span>
                    </div>
                    <span className="text-[10px] text-primary/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors font-semibold whitespace-nowrap">{config.verb} →</span>
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
