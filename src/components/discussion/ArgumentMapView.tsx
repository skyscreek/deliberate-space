import { useState, useMemo, useEffect } from 'react';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { ExternalLink, Plus, Minus } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { label: string; color: string; accent: string; borderAccent: string; bg: string }> = {
  claim:       { label: 'Claim',       color: 'text-argdown-claim',       accent: 'border-l-argdown-claim',       borderAccent: 'border-argdown-claim/30', bg: 'bg-argdown-claim' },
  support:     { label: 'Support',     color: 'text-argdown-support',     accent: 'border-l-argdown-support',     borderAccent: 'border-argdown-support/30', bg: 'bg-argdown-support' },
  objection:   { label: 'Objection',   color: 'text-argdown-objection',   accent: 'border-l-argdown-objection',   borderAccent: 'border-argdown-objection/30', bg: 'bg-argdown-objection' },
  concern:     { label: 'Concern',     color: 'text-argdown-concern',     accent: 'border-l-argdown-concern',     borderAccent: 'border-argdown-concern/30', bg: 'bg-argdown-concern' },
  alternative: { label: 'Alternative', color: 'text-argdown-alternative', accent: 'border-l-argdown-alternative', borderAccent: 'border-argdown-alternative/30', bg: 'bg-argdown-alternative' },
  question:    { label: 'Question',    color: 'text-argdown-question',    accent: 'border-l-argdown-question',    borderAccent: 'border-argdown-question/30', bg: 'bg-argdown-question' },
  proposal:    { label: 'Proposal',    color: 'text-argdown-proposal',    accent: 'border-l-argdown-proposal',    borderAccent: 'border-argdown-proposal/30', bg: 'bg-argdown-proposal' },
};

const statusLabels: Record<string, string> = {
  resolved: '✓ Resolved', contested: '⚡ Contested', unresolved: '? Unresolved', emerging: '↗ Emerging',
};

/** Collapse toggle (same as PostCard) */
function CollapseToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0"
      aria-label={collapsed ? 'Expand' : 'Collapse'}
    >
      {collapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
    </button>
  );
}

/** Clickable vertical thread line (same as PostCard) */
function ThreadLine({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex justify-center w-6 flex-1 shrink-0 cursor-pointer py-0.5 min-h-[24px]"
      aria-label="Collapse thread"
    >
      <div className="w-0.5 h-full bg-border/80 group-hover:bg-foreground/50 transition-colors rounded-full" />
    </button>
  );
}

/** Type indicator dot */
function TypeDot({ type }: { type: ArgumentNode['type'] }) {
  const config = nodeConfig[type];
  return <div className={cn('w-3 h-3 rounded-full shrink-0', config.bg)} />;
}

function totalDescendants(node: ArgumentNode): number {
  return node.children.reduce((sum, child) => sum + 1 + totalDescendants(child), 0);
}

function ArgumentNodeCard({ node, depth = 0, switchToThread }: { node: ArgumentNode; depth?: number; switchToThread: (postId: string) => void }) {
  const [collapsed, setCollapsed] = useState(depth >= 3);
  const config = nodeConfig[node.type];
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;

  return (
    <div className={cn(isRoot && 'surface-card-elevated p-4')}>
      <div className="flex">
        {/* Left column: type dot / collapse toggle + thread line */}
        <div className="flex flex-col items-center w-6 shrink-0">
          {collapsed ? (
            <div className="pt-0.5">
              <CollapseToggle collapsed onClick={() => setCollapsed(false)} />
            </div>
          ) : (
            <>
              <div className="pt-0.5">
                <TypeDot type={node.type} />
              </div>
              <ThreadLine onClick={() => setCollapsed(true)} />
            </>
          )}
        </div>

        {/* Right column: content */}
        <div className="flex-1 min-w-0 pl-2">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className={cn('font-semibold text-[10px] uppercase tracking-wider', config.color)}>{config.label}</span>
              {node.author && <span>· {node.author}</span>}
              {hasChildren && <span className="text-primary/60 font-medium">+{totalDescendants(node)} nested</span>}
            </button>
          ) : (
            <>
              <div className="py-0.5">
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
                      onClick={() => switchToThread(pid)}
                      className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary font-medium transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />{pid}
                    </button>
                  ))}
                </div>
              </div>

              {hasChildren && (
                <div className="mt-1">
                  {node.children.map((child) => (
                    <ArgumentNodeCard key={child.id} node={child} depth={depth + 1} switchToThread={switchToThread} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterType = 'all' | ArgumentNode['type'];

export default function ArgumentMapView({ nodes, onSwitchToThread, initialFilter }: { nodes: ArgumentNode[]; onSwitchToThread?: (postId: string) => void; initialFilter?: string }) {
  const { scrollToPost } = useDiscussion();
  const [filter, setFilter] = useState<FilterType>(initialFilter as FilterType || 'all');

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter as FilterType);
  }, [initialFilter]);

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
      {/* Filter bar */}
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
