import { TopicMeta } from '@/types/discussion';
import { topicDeliberationPreviews } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Swords, HelpCircle, Layers } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'seeking-consensus': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  resolved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  'seeking-consensus': 'Seeking Consensus',
  resolved: 'Resolved',
};

export default function TopicCard({ topic }: { topic: TopicMeta }) {
  const preview = topicDeliberationPreviews[topic.id];
  const href = topic.id === 'topic-1' ? '/discussion/topic-1' : '#';

  return (
    <Link to={href} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:-translate-y-0.5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
            <Badge className={`text-[10px] border-0 ${statusColors[topic.status]}`}>{statusLabels[topic.status]}</Badge>
          </div>

          <h2 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">{topic.title}</h2>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participantCount}</span>
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.postCount} posts</span>
          </div>

          {preview && (
            <div className="rounded-md bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground italic">"{preview.summary}"</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Swords className="h-3 w-3 text-destructive/60" />{preview.tensions} tensions</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3 text-amber-500" />{preview.openQuestions} open questions</span>
                <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-primary/60" />{preview.topCluster}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
