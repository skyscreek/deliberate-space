import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topic, ArgumentNode } from '@/types/discussion';
import { useTopics } from '@/hooks/useTopics';
import { useTopicRelations } from '@/hooks/useTopicRelations';
import TopicNetworkGraph, { NodeData } from '@/components/graphs/TopicNetworkGraph';
import { cn } from '@/lib/utils';
import { Zap, HelpCircle, Lightbulb, ChevronRight, Swords } from 'lucide-react';

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
  onSwitchToArgType?: (type: string) => void;
}

export default function OverviewView({ topic, onSwitchToThread, onSwitchToArgType }: Props) {
  const { data: allTopics } = useTopics();
  const { data: relations } = useTopicRelations();
  const navigate = useNavigate();

  const handleOpenDiscussion = useCallback((slug: string) => {
    navigate(`/d/${slug}`);
  }, [navigate]);

  // Arg composition
  const argCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function walk(n: ArgumentNode) {
      counts[n.type] = (counts[n.type] || 0) + 1;
      n.children.forEach(walk);
    }
    topic.argumentMap.forEach(walk);
    return counts;
  }, [topic.argumentMap]);

  const colorMap: Record<string, string> = {
    claim: 'bg-argdown-claim', support: 'bg-argdown-support', objection: 'bg-argdown-objection',
    concern: 'bg-argdown-concern', alternative: 'bg-argdown-alternative', question: 'bg-argdown-question',
    proposal: 'bg-argdown-proposal',
  };
  const total = Object.values(argCounts).reduce((a, b) => a + b, 0);
  const hasGraph = allTopics && allTopics.length >= 2;

  const hasTensions = topic.tensions.length > 0;
  const hasQuestions = topic.openQuestions.length > 0;
  const hasProposals = topic.emergingProposals.length > 0;
  const hasContextBar = hasTensions || hasQuestions || hasProposals || total > 0;

  return (
    <div className="relative">
      {/* Graph fills the view — this IS the overview */}
      {hasGraph ? (
        <div style={{ height: '600px' }} className="rounded-xl overflow-hidden border border-border">
          <TopicNetworkGraph
            topics={allTopics!}
            relations={relations ?? []}
            fullHeight
            onOpenDiscussion={handleOpenDiscussion}
          />
        </div>
      ) : (
        <div className="surface-card-elevated p-12 text-center">
          <p className="text-sm text-muted-foreground">Create more topics to see the discourse network.</p>
        </div>
      )}

      {/* Minimal context strip — only if there's analysis data */}
      {hasContextBar && (
        <div className="mt-3 bg-card border border-border rounded-lg px-4 py-3 space-y-2.5">
          {/* Arg bar */}
          {total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden flex-1">
                {Object.entries(argCounts).map(([type, count]) => (
                  <button
                    key={type}
                    className={cn('h-full transition-all cursor-pointer hover:opacity-80', colorMap[type] || 'bg-muted')}
                    style={{ width: `${(count / total) * 100}%` }}
                    title={`${type}: ${count}`}
                    onClick={() => onSwitchToArgType?.(type)}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {Object.entries(argCounts).slice(0, 5).map(([type, count]) => (
                  <span key={type} className="flex items-center gap-0.5 text-[9px] text-muted-foreground capitalize">
                    <span className={cn('w-1.5 h-1.5 rounded-full', colorMap[type])} />{type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inline tensions + questions */}
          <div className={cn('flex gap-4 flex-wrap', !hasTensions && !hasQuestions && 'hidden')}>
            {hasTensions && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-0.5">
                  <Swords className="h-2.5 w-2.5 text-argdown-concern" /> Tensions
                </span>
                {topic.tensions.slice(0, 2).map(t => (
                  <button
                    key={t.id}
                    onClick={() => t.relatedPostIds[0] && onSwitchToThread?.(t.relatedPostIds[0])}
                    className="text-[10px] text-foreground/70 hover:text-foreground transition-colors bg-accent/40 hover:bg-accent px-2 py-0.5 rounded-full"
                  >
                    {t.sideA.slice(0, 25)}… <span className="text-argdown-concern font-bold">vs</span> {t.sideB.slice(0, 25)}…
                  </button>
                ))}
              </div>
            )}
            {hasQuestions && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-0.5">
                  <HelpCircle className="h-2.5 w-2.5 text-argdown-question" /> Open
                </span>
                {topic.openQuestions.slice(0, 2).map(q => (
                  <button
                    key={q.id}
                    onClick={() => onSwitchToThread?.(q.raisedInPostId)}
                    className="text-[10px] text-foreground/70 hover:text-foreground transition-colors bg-accent/40 hover:bg-accent px-2 py-0.5 rounded-full truncate max-w-[200px]"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Proposals */}
          {hasProposals && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-0.5">
                <Lightbulb className="h-2.5 w-2.5 text-argdown-proposal" /> Proposals
              </span>
              {topic.emergingProposals.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => ep.relatedPostIds[0] && onSwitchToThread?.(ep.relatedPostIds[0])}
                  className="text-[10px] text-foreground/70 hover:text-foreground transition-colors bg-argdown-proposal/8 hover:bg-argdown-proposal/15 border border-argdown-proposal/15 px-2 py-0.5 rounded-full"
                >
                  {ep.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
