import { useState } from 'react';
import { AIAnalysis, useAnalysis, useRunAnalysis } from '@/hooks/useAnalysis';
import { useDiscussion } from '@/context/DiscussionContext';
import { Sparkles, Loader2, RefreshCw, Clock, Swords, Layers, HelpCircle, ArrowRight, AlertTriangle, Search, Eye, Lightbulb, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown } from 'lucide-react';

const guidanceIcons: Record<string, typeof AlertTriangle> = {
  overrepresented: AlertTriangle, 'evidence-needed': Search, 'missing-perspective': Eye,
  gap: Lightbulb, 'missing-counterargument': MessageSquare, 'missing-alternative': ArrowRightLeft,
  'unresolved-question': HelpCircle,
};

const guidanceColors: Record<string, string> = {
  overrepresented: 'text-argdown-concern', 'evidence-needed': 'text-argdown-proposal',
  'missing-perspective': 'text-argdown-alternative', gap: 'text-argdown-support',
  'missing-counterargument': 'text-argdown-objection', 'missing-alternative': 'text-argdown-alternative',
  'unresolved-question': 'text-argdown-question',
};

export default function DeliberationPanel({ topicId, postCount }: { topicId: string; postCount: number }) {
  const { data: cached, isLoading } = useAnalysis(topicId);
  const runAnalysis = useRunAnalysis();
  const [expanded, setExpanded] = useState(true);

  const analysis = cached?.analysis;
  const hasAnalysis = !!analysis && analysis.summary !== "This discussion has no contributions yet.";

  if (postCount === 0) return null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="surface-card-elevated overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Discussion Insights</span>
            {cached?.createdAt && hasAnalysis && (
              <span className="text-[10px] text-muted-foreground">
                · {formatDistanceToNow(new Date(cached.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!hasAnalysis && !runAnalysis.isPending && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1"
                onClick={(e) => { e.stopPropagation(); runAnalysis.mutate(topicId); }}
              >
                <Sparkles className="h-3 w-3" /> Analyze
              </Button>
            )}
            {hasAnalysis && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => { e.stopPropagation(); runAnalysis.mutate(topicId); }}
                disabled={runAnalysis.isPending}
                title="Refresh analysis"
              >
                <RefreshCw className={cn("h-3 w-3", runAnalysis.isPending && "animate-spin")} />
              </Button>
            )}
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {runAnalysis.isPending && !hasAnalysis ? (
            <div className="px-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Analyzing discussion…</span>
            </div>
          ) : isLoading ? (
            <div className="px-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : hasAnalysis ? (
            <div className="px-4 pb-4 space-y-4">
              {runAnalysis.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Refreshing…</span>
                </div>
              )}
              <SummarySection summary={analysis!.summary} />
              {analysis!.tensions?.length > 0 && <TensionsSection tensions={analysis!.tensions} />}
              {analysis!.clusters?.length > 0 && <ClustersSection clusters={analysis!.clusters} />}
              {analysis!.open_questions?.length > 0 && <QuestionsSection questions={analysis!.open_questions} />}
              {analysis!.guidance?.length > 0 && <GuidanceSection items={analysis!.guidance} />}
            </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              <p>AI insights help you understand the discussion's structure, tensions, and gaps.</p>
              <p className="text-xs mt-1">Click "Analyze" to generate insights for this discussion.</p>
            </div>
          )}

          {runAnalysis.error && (
            <div className="px-4 pb-3 text-xs text-destructive">
              {(runAnalysis.error as Error).message}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-foreground/80">{summary}</p>
    </div>
  );
}

function TensionsSection({ tensions }: { tensions: AIAnalysis['tensions'] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-0.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tensions</h4>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1.5">
        {tensions.map(t => {
          const isActive = activeFilter?.type === 'tension' && activeFilter.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => isActive ? setFilter(null) : setFilter({ type: 'tension', id: t.id, relatedPostIds: t.relatedPostIds })}
              className={cn(
                'w-full text-left rounded-md border border-border/40 bg-accent/20 p-2.5 text-xs transition-all hover:border-primary/30',
                isActive && 'ring-1 ring-highlight/60 bg-highlight-bg border-highlight/30',
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Swords className="h-3 w-3 text-argdown-objection/70" />
                <span className="font-semibold text-foreground">{t.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded bg-accent/40 p-1.5 text-muted-foreground leading-snug">{t.sideA}</div>
                <div className="rounded bg-accent/40 p-1.5 text-muted-foreground leading-snug">{t.sideB}</div>
              </div>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ClustersSection({ clusters }: { clusters: AIAnalysis['clusters'] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-0.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Topic Clusters</h4>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1.5">
        {clusters.map(c => {
          const isActive = activeFilter?.type === 'cluster' && activeFilter.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => isActive ? setFilter(null) : setFilter({ type: 'cluster', id: c.id, relatedPostIds: c.relatedPostIds })}
              className={cn(
                'w-full text-left rounded-md border border-border/40 bg-accent/20 p-2 text-xs transition-all hover:border-primary/30',
                isActive && 'ring-1 ring-highlight/60 bg-highlight-bg border-highlight/30',
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Layers className="h-3 w-3 text-primary/50" />
                <span className="font-semibold text-foreground">{c.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{c.postCount}</span>
              </div>
              <p className="text-muted-foreground leading-snug">{c.description}</p>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function QuestionsSection({ questions }: { questions: AIAnalysis['open_questions'] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter, scrollToPost } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-0.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</h4>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1.5">
        {questions.map(q => {
          const isActive = activeFilter?.type === 'question' && activeFilter.id === q.id;
          return (
            <button
              key={q.id}
              onClick={() => {
                if (isActive) { setFilter(null); }
                else {
                  setFilter({ type: 'question', id: q.id, relatedPostIds: q.relatedPostIds });
                  scrollToPost(q.raisedInPostId);
                }
              }}
              className={cn(
                'w-full text-left flex items-start gap-2 rounded-md border border-border/40 bg-accent/20 p-2 text-xs transition-all hover:border-primary/30',
                isActive && 'ring-1 ring-highlight/60 bg-highlight-bg border-highlight/30',
              )}
            >
              <HelpCircle className="h-3 w-3 mt-0.5 text-argdown-question shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-foreground/80">{q.question}</span>
                {q.raisedBy && <span className="text-muted-foreground ml-1">— {q.raisedBy}</span>}
              </div>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function GuidanceSection({ items }: { items: AIAnalysis['guidance'] }) {
  const [open, setOpen] = useState(true);
  const { startAssistedComment } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-0.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">How to Contribute</h4>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1.5">
        {items.map(item => {
          const Icon = guidanceIcons[item.type] || Lightbulb;
          return (
            <button
              key={item.id}
              onClick={() => startAssistedComment({
                guidanceId: item.id,
                targetPostId: item.targetPostId,
                label: item.label,
                description: item.description,
                suggestedArgdownType: item.suggestedArgdownType as any,
              })}
              className="group w-full text-left flex items-start gap-2 rounded-md border border-border/40 bg-accent/20 p-2 text-xs transition-all hover:border-primary/30"
            >
              <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', guidanceColors[item.type] || 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground leading-snug">{item.label}</p>
                <p className="text-muted-foreground leading-snug mt-0.5">{item.description}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
