import { Topic } from '@/types/discussion';
import ClusterList from './ClusterList';
import ContributionGuidance from './ContributionGuidance';
import { Separator } from '@/components/ui/separator';

export default function DeliberationSidebar({ topic }: { topic: Topic }) {
  return (
    <div className="space-y-4">
      <ClusterList clusters={topic.clusters} />
      <Separator />
      <ContributionGuidance items={topic.guidance} />
    </div>
  );
}
