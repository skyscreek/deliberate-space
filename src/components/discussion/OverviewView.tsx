import { useMemo, useState } from 'react';
import { Topic, ArgumentNode } from '@/types/discussion';
import { cn } from '@/lib/utils';

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
}

/* Visual cluster bubble for graphical overview */
function ClusterBubble({ name, description, postCount, isActive, onClick }: {
  name: string; description: string; postCount: number; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm',
        isActive
          ? 'border-primary/30 bg-primary/5 shadow-sm'
          : 'border-border/40 bg-card hover:border-border/60',
      )}
    >
      <span className="text-sm font-medium text-foreground block">{name}</span>
      <span className="text-[11px] text-muted-foreground/60 block mt-0.5 leading-snug">{description}</span>
      <span className="text-[10px] text-muted-foreground/40 mt-1.5 block">{postCount} posts</span>
    </button>
  );
}

/* Tension visual — two sides */
function TensionRow({ label, sideA, sideB, postCount, onClick }: {
  label: string; sideA: string; sideB: string; postCount: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg border border-border/40 bg-card p-3 hover:border-border/60 transition-all">
      <span className="text-[11px] font-medium text-foreground block">{label}</span>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded bg-accent/40 px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground/50 block mb-0.5">Side A</span>
          <span className="text-[11px] text-foreground/70 leading-snug block">{sideA.length > 80 ? sideA.slice(0, 80) + '…' : sideA}</span>
        </div>
        <div className="rounded bg-accent/40 px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground/50 block mb-0.5">Side B</span>
          <span className="text-[11px] text-foreground/70 leading-snug block">{sideB.length > 80 ? sideB.slice(0, 80) + '…' : sideB}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground/30 mt-1.5 block">{postCount} related posts</span>
    </button>
  );
}

/* Proposal card */
function ProposalCard({ title, description, supportedBy, onClick }: {
  title: string; description: string; supportedBy: string[]; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg border border-argdown-proposal/20 bg-argdown-proposal/5 p-3 hover:border-argdown-proposal/30 transition-all">
      <span className="text-[11px] font-medium text-foreground block">{title}</span>
      <span className="text-[11px] text-muted-foreground/60 block mt-0.5 leading-snug">{description}</span>
      {supportedBy.length > 0 && (
        <span className="text-[10px] text-muted-foreground/40 mt-1 block">Supported by {supportedBy.join(', ')}</span>
      )}
    </button>
  );
}

/* Stats row */
function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <span className="text-lg font-bold text-foreground block">{value}</span>
      <span className="text-[10px] text-muted-foreground/50">{label}</span>
    </div>
  );
}

export default function OverviewView({ topic, onSwitchToThread }: Props) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Count argument types
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
    <div className="space-y-5">
      {/* At-a-glance stats */}
      <div className="surface-card px-4 py-3">
        <div className="grid grid-cols-5 gap-2">
          <StatItem label="Participants" value={topic.participantCount} />
          <StatItem label="Posts" value={topic.postCount} />
          <StatItem label="Tensions" value={topic.tensions.length} />
          <StatItem label="Open Qs" value={topic.openQuestions.length} />
          <StatItem label="Unresolved" value={unresolvedCount} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-1">
        <p className="text-[13px] leading-relaxed text-foreground/75">{topic.summary.text}</p>
      </div>

      {/* Topic clusters — graphical bubbles */}
      <div>
        <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">Topic Clusters</h3>
        <div className="grid grid-cols-2 gap-2">
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

      {/* Tensions — visual pairs */}
      <div>
        <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">Key Tensions</h3>
        <div className="space-y-2">
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
          <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">Emerging Proposals</h3>
          <div className="space-y-2">
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

      {/* Argument composition bar */}
      <div>
        <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">Argument Composition</h3>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          {Object.entries(argCounts).map(([type, count]) => {
            const total = Object.values(argCounts).reduce((a, b) => a + b, 0);
            const colors: Record<string, string> = {
              claim: 'bg-argdown-claim', support: 'bg-argdown-support', objection: 'bg-argdown-objection',
              concern: 'bg-argdown-concern', alternative: 'bg-argdown-alternative', question: 'bg-argdown-question',
              proposal: 'bg-argdown-proposal',
            };
            return (
              <div
                key={type}
                className={cn('h-full', colors[type] || 'bg-muted')}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${type}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {Object.entries(argCounts).map(([type, count]) => (
            <span key={type} className="text-[10px] text-muted-foreground/40">{type} {count}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
