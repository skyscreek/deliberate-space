import { useState, useMemo } from 'react';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { label: string; color: string; accent: string; borderAccent: string }> = {
  claim:       { label: 'Claim',       color: 'text-argdown-claim',       accent: 'border-l-argdown-claim',       borderAccent: 'border-argdown-claim/30' },
  support:     { label: 'Support',     color: 'text-argdown-support',     accent: 'border-l-argdown-support',     borderAccent: 'border-argdown-support/30' },
  objection:   { label: 'Objection',   color: 'text-argdown-objection',   accent: 'border-l-argdown-objection',   borderAccent: 'border-argdown-objection/30' },
  concern:     { label: 'Concern',     color: 'text-argdown-concern',     accent: 'border-l-argdown-concern',     borderAccent: 'border-argdown-concern/30' },
  alternative: { label: 'Alternative', color: 'text-argdown-alternative', accent: 'border-l-argdown-alternative', borderAccent: 'border-argdown-alternative/30' },
  question:    { label: 'Question',    color: 'text-argdown-question',    accent: 'border-l-argdown-question',    borderAccent: 'border-argdown-question/30' },
  proposal:    { label: 'Proposal',    color: 'text-argdown-proposal',    accent: 'border-l-argdown-proposal',    borderAccent: 'border-argdown-proposal/30' },
};

const statusLabels: Record<string, string> = {
  resolved: '✓ Resolved', contested: '⚡ Contested', unresolved: '? Unresolved', emerging: '↗ Emerging',
};

function ArgumentNodeCard({ node, depth = 0, switchToThread }: { node: ArgumentNode; depth?: number; switchToThread: (postId: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = nodeConfig[node.type];
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;

  return (
    <div className={cn(!isRoot && 'ml-5 relative')}>
      {/* Connector lines for nested nodes */}
      {!isRoot && <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-border" />}
      {!isRoot && <div className="absolute left-[-12px] top-[18px] w-3 h-px bg-border" />}

      <div
        className={cn(
          'rounded-lg transition-all',
          isRoot
            ? 'surface-card-elevated'
            : cn('border-l-2 bg-accent/40', config.accent),
        )}
      >
        <div
          className={cn(
            'flex items-start gap-2.5',
            isRoot ? 'px-4 py-4' : 'px-3.5 py-3',
            hasChildren && 'cursor-pointer',
          )}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren && (
            <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
          )}
          {!hasChildren && <div className="w-3.5 shrink-0" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>{config.label}</span>
              {node.status && (
                <span className="text-[10px] text-muted-foreground">{statusLabels[node.status]}</span>
              )}
              {node.author && <span className="text-[10px] text-muted-foreground">· {node.author}</span>}
            </div>
            <p className={cn('mt-1 text-foreground leading-relaxed', isRoot ? 'text-sm font-medium' : 'text-[13px]')}>
              {node.text}
            </p>

            {/* Strength + thread refs */}
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              {node.strength != null && (
                <div className="flex items-center gap-1.5">
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
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary font-medium transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />{pid}
                </button>
              ))}
              {hasChildren && !expanded && (
                <span className="text-[10px] text-muted-foreground">{node.children.length} nested</span>
              )}
            </div>
          </div>
        </div>

        {/* Children — inside the card for root, separate area for nested */}
        {hasChildren && expanded && (
          <div className={cn(
            'space-y-2',
            isRoot ? 'px-4 pb-4 pt-2 border-t border-border/40 ml-2' : 'px-3 pb-3 pt-1.5 ml-2',
          )}>
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

export default function ArgumentMapView({ nodes, onSwitchToThread, initialFilter }: { nodes: ArgumentNode[]; onSwitchToThread?: (postId: string) => void; initialFilter?: string }) {
  const { scrollToPost } = useDiscussion();
  const [filter, setFilter] = useState<FilterType>(initialFilter as FilterType || 'all');

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
    <div className="space-y-4">
      {/* Filter bar inside card */}
      <div className="surface-card-elevated px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors',
              filter === 'all' ? 'border-foreground/20 bg-foreground/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
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
                  'rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors',
                  filter === type ? cn(c.borderAccent, c.color) : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                )}
              >{c.label} {count}</button>
            );
          })}
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-3">
        {filteredNodes.map((node) => (
          <ArgumentNodeCard key={node.id} node={node} depth={0} switchToThread={switchToThread} />
        ))}
        {filteredNodes.length === 0 && (
          <div className="surface-card-elevated p-8 text-center">
            <p className="text-sm text-muted-foreground">No arguments matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
