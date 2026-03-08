import { Topic } from '@/types/discussion';
import DiscussionSummary from './DiscussionSummary';
import TensionList from './TensionList';
import ClusterList from './ClusterList';
import OpenQuestions from './OpenQuestions';
import ContributionGuidance from './ContributionGuidance';
import { Separator } from '@/components/ui/separator';

export default function DeliberationSidebar({ topic }: { topic: Topic }) {
  return (
    <div className="space-y-4">
      <DiscussionSummary summary={topic.summary} />
      <Separator />
      <TensionList tensions={topic.tensions} />
      <Separator />
      <ClusterList clusters={topic.clusters} />
      <Separator />
      <OpenQuestions questions={topic.openQuestions} />
      <Separator />
      <ContributionGuidance items={topic.guidance} />
    </div>
  );
}
