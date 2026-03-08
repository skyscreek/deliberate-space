import { useState, useMemo } from 'react';
import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import {
  Shield, ThumbsUp, AlertTriangle, HelpCircle, Lightbulb,
  ArrowRightLeft, Target, ChevronRight, ExternalLink,
  CheckCircle2, AlertCircle, Clock, TrendingUp, Filter,
} from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { icon: typeof Shield; label: string; color: string; bgLight: string; borderColor: string }> = {
  claim:       { icon: Target,          label: 'Claim',       color: 'text-argdown-claim',       bgLight: 'bg-argdown-claim/6',  borderColor: 'border-argdown-claim' },
  support:     { icon: ThumbsUp,        label: 'Support',     color: 'text-argdown-support',     bgLight: 'bg-argdown-support/6', borderColor: 'border-argdown-support' },
  objection:   { icon: Shield,          label: 'Objection',   color: 'text-argdown-objection',   bgLight: 'bg-argdown-objection/6', borderColor: 'border-argdown-objection' },
  concern:     { icon: AlertTriangle,   label: 'Concern',     color: 'text-argdown-concern',     bgLight: 'bg-argdown-concern/6', borderColor: 'border-argdown-concern' },
  alternative: { icon: ArrowRightLeft,  label: 'Alternative', color: 'text-argdown-alternative', bgLight: 'bg-argdown-alternative/6', borderColor: 'border-argdown-alternative' },
  question:    { icon: HelpCircle,      label: 'Question',    color: 'text-argdown-question',    bgLight: 'bg-argdown-question/6', borderColor: 'border-argdown-question' },
  proposal:    { icon: Lightbulb,       label: 'Proposal',    color: 'text-argdown-proposal',    bgLight: 'bg-argdown-proposal/6', borderColor: 'border-argdown-proposal' },
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  resolved:   { icon: CheckCircle2, label: 'Resolved',   className: 'text-argdown-support bg-argdown-support/10' },
  contested:  { icon: AlertCircle,  label: 'Contested',  className: 'text-argdown-objection bg-argdown-objection/10' },
  unresolved: { icon: Clock,        label: 'Unresolved', className: 'text-argdown-question bg-argdown-question/10' },
  emerging:   { icon: TrendingUp,   label: 'Emerging',   className: 'text-argdown-proposal bg-argdown-proposal/10' },
};

function StrengthBar({ strength }: { strength?: number }) {
  if (strength == null) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Support</span>
      <div className="flex-1 h-1 rounded-full bg-border/60 max-w-[80px]">
        <div
          className="h-full rounded-full bg-argdown-support/60 transition-all"
          style={{ width: `${Math.round(strength * 100)}%` }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground/50 tabular-nums">{Math.round(strength * 100)}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status?: ArgumentNode['status'] }) {
  if (!status) return null;
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-medium', config.className)}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

function countDescendants(node: ArgumentNode): { supports: number; objections: number; questions: number; total: number } {
  let supports = 0, objections = 0, questions = 0, total = 0;
  for (const child of node.children) {
    total++;
    if (child.type === 'support') supports++;
    if (child.type === 'objection') objections++;
    if (child.type === 'question' || child.type === 'concern') questions++;
    const sub = countDescendants(child);
    supports += sub.supports;
    objections += sub.objections;
    questions += sub.questions;
    total += sub.total;
  }
  return { supports, objections, questions, total };
}

function ArgumentNodeCard({ node, depth = 0, switchToThread }: { node: ArgumentNode; depth?: number; switchToThread: (postId: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const config = nodeConfig[node.type];
  const Icon = config.icon;
  const hasChildren = node.children.length > 0;
  const counts = useMemo(() => countDescendants(node), [node]);
  const isRoot = depth === 0;

  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-5 relative')}>
      {/* Connecting line */}
      {depth > 0 && (
        <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-border/50" />
      )}
      {depth > 0 && (
        <div className="absolute left-[-12px] top-[18px] w-3 h-px bg-border/50" />
      )}

      <div className={cn(
        'rounded-lg border transition-all',
        isRoot ? 'border-border/60 bg-card' : 'border-border/40 bg-card/60',
        isRoot && config.bgLight,
      )}>
        {/* Node header */}
        <div
          className={cn('flex items-start gap-2 px-3 py-2.5', hasChildren && 'cursor-pointer')}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {/* Expand toggle */}
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {hasChildren && (
              <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
            )}
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Type + status row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>{config.label}</span>
              <StatusBadge status={node.status} />
              {node.author && <span className="text-[10px] text-muted-foreground">by {node.author}</span>}
            </div>

            {/* Text */}
            <p className={cn('mt-1 leading-relaxed text-foreground/90', isRoot ? 'text-sm font-medium' : 'text-[13px]')}>
              {node.text}
            </p>

            {/* Strength bar for root nodes */}
            {isRoot && <StrengthBar strength={node.strength} />}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Thread references */}
              {node.relatedPostIds.length > 0 && (
                <div className="flex items-center gap-1">
                  {node.relatedPostIds.map((pid) => (
                    <button
                      key={pid}
                      onClick={(e) => { e.stopPropagation(); switchToThread(pid); }}
                      className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span className="underline underline-offset-2">{pid}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Child counts for collapsed nodes */}
              {hasChildren && !expanded && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                  {counts.supports > 0 && <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5 text-argdown-support/60" />{counts.supports}</span>}
                  {counts.objections > 0 && <span className="flex items-center gap-0.5"><Shield className="h-2.5 w-2.5 text-argdown-objection/60" />{counts.objections}</span>}
                  {counts.questions > 0 && <span className="flex items-center gap-0.5"><HelpCircle className="h-2.5 w-2.5 text-argdown-question/60" />{counts.questions}</span>}
                  <span>({counts.total} nested)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && expanded && (
          <div className="pb-2.5 px-2.5 space-y-2 border-t border-border/30 pt-2.5 ml-4">
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
    if (onSwitchToThread) {
      onSwitchToThread(postId);
    } else {
      scrollToPost(postId);
    }
  };

  // Count all node types recursively
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function walk(n: ArgumentNode) {
      counts[n.type] = (counts[n.type] || 0) + 1;
      n.children.forEach(walk);
    }
    nodes.forEach(walk);
    return counts;
  }, [nodes]);

  // Filter top-level nodes (for 'all' show everything, otherwise only matching roots)
  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => {
    function hasType(node: ArgumentNode): boolean {
      if (node.type === filter) return true;
      return node.children.some(hasType);
    }
    return hasType(n);
  });

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="surface-card px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This view shows the same discussion structured as an argument map. Claims, objections, proposals, and questions are organized by their logical relationships. Click any thread reference to jump to the original comment.
        </p>
      </div>

      {/* Legend + filter bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors',
            filter === 'all'
              ? 'border-primary/30 bg-primary/8 text-foreground'
              : 'border-border/40 text-muted-foreground hover:border-border',
          )}
        >
          All
        </button>
        {Object.entries(nodeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilter(type as FilterType)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors',
                filter === type
                  ? `${config.bgLight} ${config.borderColor}/30 ${config.color}`
                  : 'border-border/40 text-muted-foreground hover:border-border',
              )}
            >
              <Icon className="h-3 w-3" />
              {config.label}
              <span className="text-muted-foreground/50 ml-0.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <span key={key} className="flex items-center gap-1">
              <Icon className={cn('h-3 w-3', config.className.split(' ')[0])} />
              {config.label}
            </span>
          );
        })}
      </div>

      {/* Argument tree */}
      <div className="space-y-3">
        {filteredNodes.map((node) => (
          <ArgumentNodeCard key={node.id} node={node} depth={0} switchToThread={switchToThread} />
        ))}

        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No arguments matching this filter.
          </div>
        )}
      </div>
    </div>
  );
}
