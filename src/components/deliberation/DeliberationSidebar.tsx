import { Topic } from '@/types/discussion';
import ClusterList from './ClusterList';
import ContributionGuidance from './ContributionGuidance';

export default function DeliberationSidebar({ topic }: { topic: Topic }) {
  return (
    <div className="space-y-4">
      <ClusterList clusters={topic.clusters} />
      <div className="border-t border-border/40" />
      <ContributionGuidance items={topic.guidance} />
    </div>
  );
}
