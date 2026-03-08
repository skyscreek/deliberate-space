import { useState, useMemo } from 'react';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { label: string; color: string; bg: string; border: string }> = {
  claim:       { label: 'Claim',       color: 'text-argdown-claim',       bg: 'bg-card',   border: 'border-argdown-claim/30' },
  support:     { label: 'Support',     color: 'text-argdown-support',     bg: 'bg-card',   border: 'border-argdown-support/30' },
  objection:   { label: 'Objection',   color: 'text-argdown-objection',   bg: 'bg-card',   border: 'border-argdown-objection/30' },
  concern:     { label: 'Concern',     color: 'text-argdown-concern',     bg: 'bg-card',   border: 'border-argdown-concern/30' },
  alternative: { label: 'Alternative', color: 'text-argdown-alternative', bg: 'bg-card',   border: 'border-argdown-alternative/30' },
  question:    { label: 'Question',    color: 'text-argdown-question',    bg: 'bg-card',   border: 'border-argdown-question/30' },
  proposal:    { label: 'Proposal',    color: 'text-argdown-proposal',    bg: 'bg-card',   border: 'border-argdown-proposal/30' },
};

const statusLabels: Record<string, string> = {
  resolved: '✓ Resolved', contested: '⚡ Contested', unresolved: '? Unresolved', emerging: '↗ Emerging',
};

function ArgumentNodeCard({ node, depth = 0, switchToThread }: { node: ArgumentNode; depth?: number; switchToThread: (postId: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = nodeConfig[node.type];
  const hasChildren = node.children.length > 0;

  return (
    <div className={cn(depth > 0 && 'ml-4 relative')}>
      {depth > 0 && <div className="absolute left-[-8px] top-0 bottom-0 w-px bg-border" />}
      {depth > 0 && <div className="absolute left-[-8px] top-[14px] w-2 h-px bg-border" />}

      <div className={cn('rounded-md border shadow-sm transition-all', config.bg, config.border)}>
        <div
          className={cn('flex items-start gap-1.5 px-2.5 py-2', hasChildren && 'cursor-pointer')}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren && (
            <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
          )}
          {!hasChildren && <div className="w-3 shrink-0" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>{config.label}</span>
              {node.status && (
                <span className="text-[10px] text-muted-foreground">{statusLabels[node.status]}</span>
              )}
              {node.author && <span className="text-[10px] text-muted-foreground">· {node.author}</span>}
            </div>
            <p className={cn('mt-0.5 text-foreground leading-relaxed', depth === 0 ? 'text-sm font-medium' : 'text-[13px]')}>
              {node.text}
            </p>

            {/* Strength + thread refs in compact row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {node.strength != null && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 rounded-full bg-border w-12">
                    <div className="h-full rounded-full bg-argdown-support" style={{ width: `${Math.round(node.strength * 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{Math.round(node.strength * 100)}%</span>
                </div>
              )}
              {node.relatedPostIds.length > 0 && node.relatedPostIds.map((pid) => (
                <button
                  key={pid}
                  onClick={(e) => { e.stopPropagation(); switchToThread(pid); }}
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary font-medium transition-colors"
                >
                  <ExternalLink className="h-2 w-2" />{pid}
                </button>
              ))}
              {hasChildren && !expanded && (
                <span className="text-[10px] text-muted-foreground">{node.children.length} nested</span>
              )}
            </div>
          </div>
        </div>

        {hasChildren && expanded && (
          <div className="pb-2 px-2 space-y-1.5 border-t border-border/40 pt-1.5 ml-3">
            {node.children.map((child) => (
              <ArgumentNodeCard key={child.id} node={child} depth={depth + 1} switchToThread={switchToThread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type FilterType = 'all' | ArgumentNode['type'];

export default function ArgumentMapView({ nodes, onSwitchToThread }: { nodes: ArgumentNode[]; onSwitchToThread?: (postId: string) => void }) {
  const { scrollToPost } = useDiscussion();
  const [filter, setFilter] = useState<FilterType>('all');

  const switchToThread = (postId: string) => {
    if (onSwitchToThread) onSwitchToThread(postId);
    else scrollToPost(postId);
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function walk(n: ArgumentNode) { counts[n.type] = (counts[n.type] || 0) + 1; n.children.forEach(walk); }
    nodes.forEach(walk);
    return counts;
  }, [nodes]);

  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => {
    function hasType(node: ArgumentNode): boolean { return node.type === filter || node.children.some(hasType); }
    return hasType(n);
  });

  return (
    <div className="space-y-3">
      {/* Compact filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors',
            filter === 'all' ? 'border-primary/20 bg-primary/5 text-foreground' : 'border-border/30 text-muted-foreground/50 hover:border-border/50',
          )}
        >All</button>
        {Object.entries(nodeConfig).map(([type, c]) => {
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilter(type as FilterType)}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors',
                filter === type ? `${c.bg} ${c.border} ${c.color}` : 'border-border/30 text-muted-foreground/50 hover:border-border/50',
              )}
            >{c.label} {count}</button>
          );
        })}
      </div>

      {/* Tree */}
      <div className="space-y-2">
        {filteredNodes.map((node) => (
          <ArgumentNodeCard key={node.id} node={node} depth={0} switchToThread={switchToThread} />
        ))}
        {filteredNodes.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground/50">No arguments matching this filter.</p>
        )}
      </div>
    </div>
  );
}
