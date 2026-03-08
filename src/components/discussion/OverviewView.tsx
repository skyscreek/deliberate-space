import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topic, ArgumentNode } from '@/types/discussion';
import { useTopics } from '@/hooks/useTopics';
import { useTopicRelations } from '@/hooks/useTopicRelations';
import TopicNetworkGraph from '@/components/graphs/TopicNetworkGraph';
import DiscussionSummary from '@/components/deliberation/DiscussionSummary';
import TensionList from '@/components/deliberation/TensionList';
import OpenQuestions from '@/components/deliberation/OpenQuestions';
import EmergingProposals from '@/components/deliberation/EmergingProposals';
import ClusterList from '@/components/deliberation/ClusterList';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Map } from 'lucide-react';

interface Props {
  topic: Topic;
  onSwitchToThread?: (postId: string) => void;
  onSwitchToArgType?: (type: string) => void;
}

export default function OverviewView({ topic, onSwitchToThread, onSwitchToArgType }: Props) {
  const { data: allTopics } = useTopics();
  const { data: relations } = useTopicRelations();
  const navigate = useNavigate();
  const [graphOpen, setGraphOpen] = useState(true);

  const handleOpenDiscussion = (slug: string) => {
    navigate(`/d/${slug}`);
  };

  const hasGraph = allTopics && allTopics.length >= 2;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Summary Module */}
      {topic.summary && topic.summary.text && (
        <section className="surface-card p-5 rounded-xl border border-border/40">
          <DiscussionSummary summary={topic.summary.text} />
        </section>
      )}

      {/* 2. Graph Module (Local Context) */}
      {hasGraph && (
        <Collapsible open={graphOpen} onOpenChange={setGraphOpen} className="surface-card rounded-xl border border-border/40 overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Local Topic Network</h3>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", graphOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TopicNetworkGraph
              topics={allTopics!}
              relations={relations ?? []}
              mode="local"
              currentTopicId={topic.id}
              height="320px"
              onOpenDiscussion={handleOpenDiscussion}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 3. Rich Overview Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Tensions & Questions */}
        <div className="space-y-4">
          {topic.tensions.length > 0 && (
            <section className="surface-card p-4 rounded-xl border border-border/40">
              <TensionList tensions={topic.tensions} />
            </section>
          )}

          {topic.openQuestions.length > 0 && (
            <section className="surface-card p-4 rounded-xl border border-border/40">
              <OpenQuestions questions={topic.openQuestions} />
            </section>
          )}
        </div>

        {/* Right Column: Proposals & Clusters */}
        <div className="space-y-4">
          {topic.emergingProposals && topic.emergingProposals.length > 0 && (
            <section className="surface-card p-4 rounded-xl border border-border/40">
              <EmergingProposals proposals={topic.emergingProposals} />
            </section>
          )}

          {topic.clusters && topic.clusters.length > 0 && (
            <section className="surface-card p-4 rounded-xl border border-border/40">
              <ClusterList clusters={topic.clusters} />
            </section>
          )}
        </div>

      </div>
    </div>
  );
}