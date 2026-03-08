import { useState, useMemo } from 'react';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { label: string; color: string; bg: string; border: string }> = {
  claim:       { label: 'Claim',       color: 'text-argdown-claim',       bg: 'bg-argdown-claim/6',       border: 'border-argdown-claim/20' },
  support:     { label: 'Support',     color: 'text-argdown-support',     bg: 'bg-argdown-support/6',     border: 'border-argdown-support/20' },
  objection:   { label: 'Objection',   color: 'text-argdown-objection',   bg: 'bg-argdown-objection/6',   border: 'border-argdown-objection/20' },
  concern:     { label: 'Concern',     color: 'text-argdown-concern',     bg: 'bg-argdown-concern/6',     border: 'border-argdown-concern/20' },
  alternative: { label: 'Alternative', color: 'text-argdown-alternative', bg: 'bg-argdown-alternative/6', border: 'border-argdown-alternative/20' },
  question:    { label: 'Question',    color: 'text-argdown-question',    bg: 'bg-argdown-question/6',    border: 'border-argdown-question/20' },
  proposal:    { label: 'Proposal',    color: 'text-argdown-proposal',    bg: 'bg-argdown-proposal/6',    border: 'border-argdown-proposal/20' },
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
      {depth > 0 && <div className="absolute left-[-8px] top-0 bottom-0 w-px bg-border/30" />}
      {depth > 0 && <div className="absolute left-[-8px] top-[14px] w-2 h-px bg-border/30" />}

      <div className={cn('rounded-md border transition-all', config.bg, config.border)}>
        <div
          className={cn('flex items-start gap-1.5 px-2.5 py-2', hasChildren && 'cursor-pointer')}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren && (
            <ChevronRight className={cn('h-3 w-3 shrink-0 mt-1 text-muted-foreground/40 transition-transform', expanded && 'rotate-90')} />
          )}
          {!hasChildren && <div className="w-3 shrink-0" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-[9px] font-medium uppercase tracking-wider', config.color)}>{config.label}</span>
              {node.status && (
                <span className="text-[9px] text-muted-foreground/40">{statusLabels[node.status]}</span>
              )}
              {node.author && <span className="text-[9px] text-muted-foreground/30">· {node.author}</span>}
            </div>
            <p className={cn('mt-0.5 text-foreground/85 leading-relaxed', depth === 0 ? 'text-[13px] font-medium' : 'text-[12px]')}>
              {node.text}
            </p>

            {/* Strength + thread refs in compact row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {node.strength != null && (
                <div className="flex items-center gap-1">
                  <div className="h-1 rounded-full bg-border/40 w-10">
                    <div className="h-full rounded-full bg-argdown-support/40" style={{ width: `${Math.round(node.strength * 100)}%` }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground/30 tabular-nums">{Math.round(node.strength * 100)}%</span>
                </div>
              )}
              {node.relatedPostIds.length > 0 && node.relatedPostIds.map((pid) => (
                <button
                  key={pid}
                  onClick={(e) => { e.stopPropagation(); switchToThread(pid); }}
                  className="inline-flex items-center gap-0.5 text-[9px] text-primary/40 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-2 w-2" />{pid}
                </button>
              ))}
              {hasChildren && !expanded && (
                <span className="text-[9px] text-muted-foreground/30">{node.children.length} nested</span>
              )}
            </div>
          </div>
        </div>

        {hasChildren && expanded && (
          <div className="pb-2 px-2 space-y-1.5 border-t border-border/20 pt-1.5 ml-3">
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
