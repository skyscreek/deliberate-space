import { ArgumentNode } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Shield, ThumbsUp, AlertTriangle, HelpCircle, Lightbulb, ArrowRightLeft, Target } from 'lucide-react';

const nodeConfig: Record<ArgumentNode['type'], { icon: typeof Shield; label: string; color: string; bg: string }> = {
  claim:       { icon: Target,          label: 'Claim',       color: 'text-argdown-claim',       bg: 'bg-argdown-claim/8 border-l-argdown-claim' },
  support:     { icon: ThumbsUp,        label: 'Support',     color: 'text-argdown-support',     bg: 'bg-argdown-support/8 border-l-argdown-support' },
  objection:   { icon: Shield,          label: 'Objection',   color: 'text-argdown-objection',   bg: 'bg-argdown-objection/8 border-l-argdown-objection' },
  concern:     { icon: AlertTriangle,   label: 'Concern',     color: 'text-argdown-concern',     bg: 'bg-argdown-concern/8 border-l-argdown-concern' },
  alternative: { icon: ArrowRightLeft,  label: 'Alternative', color: 'text-argdown-alternative', bg: 'bg-argdown-alternative/8 border-l-argdown-alternative' },
  question:    { icon: HelpCircle,      label: 'Open Question', color: 'text-argdown-question', bg: 'bg-argdown-question/8 border-l-argdown-question' },
  proposal:    { icon: Lightbulb,       label: 'Proposal',    color: 'text-argdown-proposal',    bg: 'bg-argdown-proposal/8 border-l-argdown-proposal' },
};

function ArgumentNodeCard({ node, depth = 0 }: { node: ArgumentNode; depth?: number }) {
  const { scrollToPost } = useDiscussion();
  const config = nodeConfig[node.type];
  const Icon = config.icon;

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-4 sm:ml-6')}>
      <div className={cn(
        'glass-subtle rounded-lg border-l-[3px] px-3 py-2.5 transition-colors',
        config.bg,
      )}>
        <div className="flex items-start gap-2">
          <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>{config.label}</span>
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
          Structured Argdown view of claims, evidence, objections, and proposals extracted from the discussion.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(nodeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Icon className={cn('h-3 w-3', config.color)} />
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
