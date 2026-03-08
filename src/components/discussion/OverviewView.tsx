import { useMemo, useState, useCallback } from 'react';
import { Topic, ArgumentNode } from '@/types/discussion';
import { cn } from '@/lib/utils';
import {
  Shield, ThumbsUp, AlertTriangle, HelpCircle, Lightbulb,
  ArrowRightLeft, Target, ExternalLink, Filter,
} from 'lucide-react';

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
}

const nodeColors: Record<string, { bg: string; border: string; text: string; icon: typeof Target }> = {
  claim:       { bg: 'bg-argdown-claim/8',       border: 'border-argdown-claim/25',       text: 'text-argdown-claim',       icon: Target },
  support:     { bg: 'bg-argdown-support/8',      border: 'border-argdown-support/25',     text: 'text-argdown-support',     icon: ThumbsUp },
  objection:   { bg: 'bg-argdown-objection/8',    border: 'border-argdown-objection/25',   text: 'text-argdown-objection',   icon: Shield },
  concern:     { bg: 'bg-argdown-concern/8',      border: 'border-argdown-concern/25',     text: 'text-argdown-concern',     icon: AlertTriangle },
  alternative: { bg: 'bg-argdown-alternative/8',  border: 'border-argdown-alternative/25', text: 'text-argdown-alternative', icon: ArrowRightLeft },
  question:    { bg: 'bg-argdown-question/8',     border: 'border-argdown-question/25',    text: 'text-argdown-question',    icon: HelpCircle },
  proposal:    { bg: 'bg-argdown-proposal/8',     border: 'border-argdown-proposal/25',    text: 'text-argdown-proposal',    icon: Lightbulb },
};

type FilterType = 'all' | ArgumentNode['type'];

/* Flat node for the visual map */
interface FlatNode {
  node: ArgumentNode;
  depth: number;
  parentId?: string;
}

function flattenNodes(nodes: ArgumentNode[], depth = 0, parentId?: string): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({ node, depth, parentId });
    if (node.children.length > 0) {
      result.push(...flattenNodes(node.children, depth + 1, node.id));
    }
  }
  return result;
}

function NodeCard({ node, depth, onThreadRef }: { node: ArgumentNode; depth: number; onThreadRef: (postId: string) => void }) {
  const style = nodeColors[node.type] || nodeColors.claim;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 transition-colors',
        style.bg, style.border,
      )}
      style={{ marginLeft: `${depth * 24}px` }}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', style.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-medium uppercase tracking-wider', style.text)}>
              {node.type}
            </span>
            {node.status && (
              <span className={cn(
                'text-[9px] rounded-full px-1.5 py-px',
                node.status === 'resolved' && 'bg-argdown-support/10 text-argdown-support',
                node.status === 'contested' && 'bg-argdown-objection/10 text-argdown-objection',
                node.status === 'unresolved' && 'bg-argdown-question/10 text-argdown-question',
                node.status === 'emerging' && 'bg-argdown-proposal/10 text-argdown-proposal',
              )}>
                {node.status}
              </span>
            )}
            {node.author && <span className="text-[10px] text-muted-foreground/50">by {node.author}</span>}
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed mt-1">{node.text}</p>

          {node.strength != null && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-border/60 max-w-[60px]">
                <div className="h-full rounded-full bg-argdown-support/50" style={{ width: `${Math.round(node.strength * 100)}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">{Math.round(node.strength * 100)}%</span>
            </div>
          )}

          {node.relatedPostIds.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {node.relatedPostIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => onThreadRef(pid)}
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  <span className="underline underline-offset-2">{pid}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OverviewView({ topic, onSwitchToThread }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const handleThreadRef = useCallback((postId: string) => {
    onSwitchToThread?.(postId);
  }, [onSwitchToThread]);

  const allFlat = useMemo(() => flattenNodes(topic.argumentMap), [topic.argumentMap]);

  const filteredFlat = useMemo(() => {
    if (filter === 'all') return allFlat;
    return allFlat.filter(f => f.node.type === filter);
  }, [allFlat, filter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of allFlat) {
      counts[f.node.type] = (counts[f.node.type] || 0) + 1;
    }
    return counts;
  }, [allFlat]);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="surface-card px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground/85">{topic.summary.text}</p>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground/50">
          <span>{topic.participantCount} participants</span>
          <span>{topic.postCount} posts</span>
          <span>{topic.tensions.length} tensions</span>
          <span>{topic.openQuestions.length} open questions</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3 w-3 text-muted-foreground/40 mr-0.5" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-medium border transition-colors',
            filter === 'all' ? 'border-primary/30 bg-primary/8 text-foreground' : 'border-border/40 text-muted-foreground/60 hover:border-border',
          )}
        >
          All ({allFlat.length})
        </button>
        {Object.entries(nodeColors).map(([type, style]) => {
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          const Icon = style.icon;
          return (
            <button
              key={type}
              onClick={() => setFilter(type as FilterType)}
              className={cn(
                'rounded-full px-2 py-1 text-[10px] font-medium border transition-colors inline-flex items-center gap-1',
                filter === type ? `${style.bg} ${style.border} ${style.text}` : 'border-border/40 text-muted-foreground/60 hover:border-border',
              )}
            >
              <Icon className="h-3 w-3" />
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Visual node map — flat list with indentation */}
      <div className="space-y-2">
        {filteredFlat.map((f) => (
          <NodeCard
            key={f.node.id}
            node={f.node}
            depth={filter === 'all' ? f.depth : 0}
            onThreadRef={handleThreadRef}
          />
        ))}
        {filteredFlat.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No arguments matching this filter.
          </div>
        )}
      </div>
    </div>
  );
}
