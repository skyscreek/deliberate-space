import { useMemo, useState, useCallback } from 'react';
import { Topic, ArgumentNode } from '@/types/discussion';
import { cn } from '@/lib/utils';

/** Renders summary text with inline [linked references](@postId) */
function SummaryText({ text, onClickRef }: { text: string; onClickRef: (postId: string) => void }) {
  const parts = text.split(/(\[[^\]]+\]\(@[^)]+\))/g);
  return (
    <p className="text-sm leading-relaxed text-foreground/85">
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(@([^)]+)\)$/);
        if (match) {
          return (
            <button
              key={i}
              onClick={() => onClickRef(match[2])}
              className="text-primary/80 hover:text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors"
            >
              {match[1]}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
}

/* Visual cluster bubble */
function ClusterBubble({ name, description, postCount, isActive, onClick }: {
  name: string; description: string; postCount: number; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'surface-card-elevated px-4 py-3 text-left transition-all hover:border-primary/30',
        isActive && 'border-primary/30 ring-1 ring-primary/20',
      )}
    >
      <span className="text-sm font-medium text-foreground block">{name}</span>
      <span className="text-xs text-muted-foreground block mt-0.5 leading-snug">{description}</span>
      <span className="text-[11px] text-muted-foreground/70 mt-1.5 block">{postCount} posts</span>
    </button>
  );
}

/* Tension visual — two sides */
function TensionRow({ label, sideA, sideB, postCount, onClick }: {
  label: string; sideA: string; sideB: string; postCount: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left surface-card-elevated p-4 transition-all hover:border-primary/30">
      <span className="text-xs font-semibold text-foreground block">{label}</span>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-accent/60 px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground block mb-0.5 font-medium">Side A</span>
          <span className="text-xs text-foreground/80 leading-snug block">{sideA.length > 80 ? sideA.slice(0, 80) + '…' : sideA}</span>
        </div>
        <div className="rounded-md bg-accent/60 px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground block mb-0.5 font-medium">Side B</span>
          <span className="text-xs text-foreground/80 leading-snug block">{sideB.length > 80 ? sideB.slice(0, 80) + '…' : sideB}</span>
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground mt-2 block">{postCount} related posts</span>
    </button>
  );
}

/* Proposal card */
function ProposalCard({ title, description, supportedBy, onClick }: {
  title: string; description: string; supportedBy: string[]; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left surface-card-elevated p-4 border-l-2 border-l-argdown-proposal/40 transition-all hover:border-primary/30">
      <span className="text-xs font-semibold text-foreground block">{title}</span>
      <span className="text-xs text-muted-foreground block mt-0.5 leading-snug">{description}</span>
      {supportedBy.length > 0 && (
        <span className="text-[11px] text-muted-foreground/70 mt-1.5 block">Supported by {supportedBy.join(', ')}</span>
      )}
    </button>
  );
}

/* Stats row */
function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <span className="text-lg font-bold text-foreground block">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function OverviewView({ topic, onSwitchToThread }: Props) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const argCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function walk(n: ArgumentNode) {
      counts[n.type] = (counts[n.type] || 0) + 1;
      n.children.forEach(walk);
    }
    topic.argumentMap.forEach(walk);
    return counts;
  }, [topic.argumentMap]);

  const unresolvedCount = useMemo(() => {
    let count = 0;
    function walk(n: ArgumentNode) {
      if (n.status === 'unresolved') count++;
      n.children.forEach(walk);
    }
    topic.argumentMap.forEach(walk);
    return count;
  }, [topic.argumentMap]);

  return (
    <div className="space-y-4">
      {/* At-a-glance stats */}
      <div className="surface-card-elevated px-4 py-3.5">
        <div className="grid grid-cols-5 gap-2">
          <StatItem label="Participants" value={topic.participantCount} />
          <StatItem label="Posts" value={topic.postCount} />
          <StatItem label="Tensions" value={topic.tensions.length} />
          <StatItem label="Open Qs" value={topic.openQuestions.length} />
          <StatItem label="Unresolved" value={unresolvedCount} />
        </div>
      </div>

      {/* Argument composition — moved up */}
      <div className="surface-card-elevated p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2.5">Argument Composition</h3>
        {(() => {
          const total = Object.values(argCounts).reduce((a, b) => a + b, 0);
          const colorMap: Record<string, string> = {
            claim: 'bg-argdown-claim', support: 'bg-argdown-support', objection: 'bg-argdown-objection',
            concern: 'bg-argdown-concern', alternative: 'bg-argdown-alternative', question: 'bg-argdown-question',
            proposal: 'bg-argdown-proposal',
          };
          return (
            <>
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                {Object.entries(argCounts).map(([type, count]) => (
                  <button
                    key={type}
                    className={cn(
                      'h-full transition-all duration-200 cursor-pointer',
                      colorMap[type] || 'bg-muted',
                      highlightedType && highlightedType !== type && 'opacity-25',
                    )}
                    style={{ width: `${(count / total) * 100}%` }}
                    title={`${type}: ${count}`}
                    onClick={() => setHighlightedType(highlightedType === type ? null : type)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                {Object.entries(argCounts).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setHighlightedType(highlightedType === type ? null : type)}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] capitalize transition-all duration-150 rounded px-1.5 py-0.5 -mx-1.5',
                      highlightedType === type
                        ? 'text-foreground font-medium bg-accent'
                        : highlightedType
                          ? 'text-muted-foreground/50 hover:text-muted-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', colorMap[type] || 'bg-muted')} />
                    {type} {count}
                  </button>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Summary */}
      <div className="surface-card-elevated p-4">
        <SummaryText text={topic.summary.text} onClickRef={(postId) => onSwitchToThread?.(postId)} />
      </div>

      {/* Topic clusters */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">Topic Clusters</h3>
        <div className="grid grid-cols-2 gap-3">
          {topic.clusters.map((c) => (
            <ClusterBubble
              key={c.id}
              name={c.name}
              description={c.description}
              postCount={c.postCount}
              isActive={selectedCluster === c.id}
              onClick={() => {
                setSelectedCluster(selectedCluster === c.id ? null : c.id);
                if (c.relatedPostIds[0] && onSwitchToThread) onSwitchToThread(c.relatedPostIds[0]);
              }}
            />
          ))}
        </div>
      </div>

      {/* Tensions */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">Key Tensions</h3>
        <div className="space-y-3">
          {topic.tensions.map((t) => (
            <TensionRow
              key={t.id}
              label={t.label}
              sideA={t.sideA}
              sideB={t.sideB}
              postCount={t.relatedPostIds.length}
              onClick={() => {
                if (t.relatedPostIds[0] && onSwitchToThread) onSwitchToThread(t.relatedPostIds[0]);
              }}
            />
          ))}
        </div>
      </div>

      {/* Emerging Proposals */}
      {topic.emergingProposals.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">Emerging Proposals</h3>
          <div className="space-y-3">
            {topic.emergingProposals.map((ep) => (
              <ProposalCard
                key={ep.id}
                title={ep.title}
                description={ep.description}
                supportedBy={ep.supportedBy}
                onClick={() => {
                  if (ep.relatedPostIds[0] && onSwitchToThread) onSwitchToThread(ep.relatedPostIds[0]);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
