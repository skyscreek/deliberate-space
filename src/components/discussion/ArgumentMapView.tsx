import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Shield, ThumbsUp, AlertTriangle, HelpCircle, Lightbulb, ArrowRightLeft, Target } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { icon: typeof Shield; label: string; borderColor: string; bgColor: string; iconColor: string }> = {
  claim: { icon: Target, label: 'Claim', borderColor: 'border-l-primary', bgColor: 'bg-card', iconColor: 'text-primary' },
  support: { icon: ThumbsUp, label: 'Support', borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-50/30 dark:bg-emerald-950/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  objection: { icon: Shield, label: 'Objection', borderColor: 'border-l-destructive', bgColor: 'bg-red-50/30 dark:bg-red-950/20', iconColor: 'text-destructive' },
  concern: { icon: AlertTriangle, label: 'Concern', borderColor: 'border-l-amber-500', bgColor: 'bg-amber-50/30 dark:bg-amber-950/20', iconColor: 'text-amber-600 dark:text-amber-400' },
  alternative: { icon: ArrowRightLeft, label: 'Alternative', borderColor: 'border-l-violet-500', bgColor: 'bg-violet-50/30 dark:bg-violet-950/20', iconColor: 'text-violet-600 dark:text-violet-400' },
  question: { icon: HelpCircle, label: 'Open Question', borderColor: 'border-l-amber-500', bgColor: 'bg-amber-50/20 dark:bg-amber-950/10', iconColor: 'text-amber-500' },
  proposal: { icon: Lightbulb, label: 'Proposal', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-50/30 dark:bg-blue-950/20', iconColor: 'text-blue-600 dark:text-blue-400' },
};

function ArgumentNodeCard({ node, depth = 0 }: { node: ArgumentNode; depth?: number }) {
  const { scrollToPost } = useDiscussion();
  const config = nodeConfig[node.type];
  const Icon = config.icon;

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-4 sm:ml-6')}>
      <div className={cn(
        'rounded-md border border-l-[3px] px-3 py-2.5 transition-colors',
        config.borderColor,
        config.bgColor,
      )}>
        <div className="flex items-start gap-2">
          <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.iconColor)}>{config.label}</span>
              {node.author && <span className="text-[10px] text-muted-foreground">by {node.author}</span>}
            </div>
            <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">{node.text}</p>
            {node.relatedPostIds.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                {node.relatedPostIds.map((pid) => (
                  <button
                    key={pid}
                    onClick={() => scrollToPost(pid)}
                    className="text-[10px] text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                  >
                    →{pid}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <ArgumentNodeCard key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArgumentMapView({ nodes }: { nodes: ArgumentNode[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <p className="text-xs text-muted-foreground">
          Structured view of claims, evidence, objections, and proposals extracted from the discussion.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(nodeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Icon className={cn('h-3 w-3', config.iconColor)} />
              <span>{config.label}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {nodes.map((node) => (
          <ArgumentNodeCard key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
