import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topic, ArgumentNode } from '@/types/discussion';
import { useTopics } from '@/hooks/useTopics';
import { useTopicRelations } from '@/hooks/useTopicRelations';
import TopicNetworkGraph from '@/components/graphs/TopicNetworkGraph';
import { cn } from '@/lib/utils';
import { ExternalLink, MessageSquare, Users, Zap, HelpCircle, Lightbulb, ChevronRight, X, Swords } from 'lucide-react';

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
  onSwitchToArgType?: (type: string) => void;
}

interface SelectedInfo {
  id: string;
  slug: string;
  title: string;
  category: string;
  postCount: number;
  status: string;
  cluster: number;
}

export default function OverviewView({ topic, onSwitchToThread, onSwitchToArgType }: Props) {
  const { data: allTopics } = useTopics();
  const { data: relations } = useTopicRelations();
  const [selectedNode, setSelectedNode] = useState<SelectedInfo | null>(null);
  const navigate = useNavigate();

  const handleSelectNode = useCallback((_id: string | null, data: any) => {
    setSelectedNode(data);
  }, []);

  const handleOpenDiscussion = useCallback((slug: string) => {
    navigate(`/d/${slug}`);
  }, [navigate]);

  // Arg composition for the mini bar
  const argCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function walk(n: ArgumentNode) {
      counts[n.type] = (counts[n.type] || 0) + 1;
      n.children.forEach(walk);
    }
    topic.argumentMap.forEach(walk);
    return counts;
  }, [topic.argumentMap]);

  const colorMap: Record<string, string> = {
    claim: 'bg-argdown-claim', support: 'bg-argdown-support', objection: 'bg-argdown-objection',
    concern: 'bg-argdown-concern', alternative: 'bg-argdown-alternative', question: 'bg-argdown-question',
    proposal: 'bg-argdown-proposal',
  };

  const total = Object.values(argCounts).reduce((a, b) => a + b, 0);
  const hasGraph = allTopics && allTopics.length >= 2;

  return (
    <div className="space-y-0">
      {/* Graph as primary element */}
      {hasGraph ? (
        <div className="relative" style={{ height: '520px' }}>
          <TopicNetworkGraph
            topics={allTopics!}
            relations={relations ?? []}
            fullHeight
            onSelectNode={handleSelectNode}
            onOpenDiscussion={handleOpenDiscussion}
          />

          {/* Context panel overlay — right side */}
          {selectedNode && (
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-card/95 backdrop-blur-md border-l border-border overflow-y-auto z-20 shadow-lg">
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{selectedNode.title}</h3>
                  <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground p-0.5 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-full border border-border text-primary font-medium">{selectedNode.category}</span>
                  <span className="text-muted-foreground">{selectedNode.postCount} posts</span>
                </div>
                <button
                  onClick={() => handleOpenDiscussion(selectedNode.slug)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Open Discussion <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="surface-card-elevated p-8 text-center rounded-t-lg">
          <p className="text-sm text-muted-foreground">Create more topics to see the discourse network graph.</p>
        </div>
      )}

      {/* Compact info strip below graph */}
      <div className="bg-card border border-border border-t-0 rounded-b-lg px-4 py-3 space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participantCount} participants</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.postCount} posts</span>
          <span className="flex items-center gap-1"><Swords className="h-3 w-3" />{topic.tensions.length} tensions</span>
          <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{topic.openQuestions.length} open questions</span>
        </div>

        {/* Argument composition mini bar */}
        {total > 0 && (
          <div>
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              {Object.entries(argCounts).map(([type, count]) => (
                <button
                  key={type}
                  className={cn('h-full transition-all cursor-pointer hover:opacity-80', colorMap[type] || 'bg-muted')}
                  style={{ width: `${(count / total) * 100}%` }}
                  title={`${type}: ${count}`}
                  onClick={() => onSwitchToArgType?.(type)}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {Object.entries(argCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => onSwitchToArgType?.(type)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors capitalize"
                >
                  <span className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', colorMap[type] || 'bg-muted')} />
                  {type} {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tensions + Questions in compact horizontal layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Key tensions */}
          {topic.tensions.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Zap className="h-3 w-3 text-argdown-concern" /> Key Tensions
              </h4>
              <div className="space-y-1.5">
                {topic.tensions.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    onClick={() => t.relatedPostIds[0] && onSwitchToThread?.(t.relatedPostIds[0])}
                    className="w-full text-left text-xs text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-argdown-concern shrink-0" />
                    <span className="truncate flex-1">{t.sideA}</span>
                    <span className="text-[9px] text-argdown-concern font-bold shrink-0">vs</span>
                    <span className="truncate flex-1">{t.sideB}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Open questions */}
          {topic.openQuestions.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-argdown-question" /> Open Questions
              </h4>
              <div className="space-y-1.5">
                {topic.openQuestions.slice(0, 3).map(q => (
                  <button
                    key={q.id}
                    onClick={() => onSwitchToThread?.(q.raisedInPostId)}
                    className="w-full text-left text-xs text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-argdown-question shrink-0" />
                    <span className="truncate flex-1">{q.question}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emerging proposals */}
        {topic.emergingProposals.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-argdown-proposal" /> Emerging Proposals
            </h4>
            <div className="flex flex-wrap gap-2">
              {topic.emergingProposals.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => ep.relatedPostIds[0] && onSwitchToThread?.(ep.relatedPostIds[0])}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-argdown-proposal/20 bg-argdown-proposal/5 text-foreground hover:border-argdown-proposal/40 transition-colors"
                >
                  <Lightbulb className="h-3 w-3 text-argdown-proposal inline mr-1" />
                  {ep.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
