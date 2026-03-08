import { TopicMeta } from '@/types/discussion';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  active: 'bg-argdown-support/15 text-argdown-support border-argdown-support/30',
  'seeking-consensus': 'bg-highlight-bg text-highlight border-highlight/30',
  resolved: 'bg-primary/10 text-primary border-primary/30',
};

const statusLabels: Record<string, string> = {
  active: 'Active Discussion',
  'seeking-consensus': 'Seeking Consensus',
  resolved: 'Resolved',
};

export default function TopicHeader({ topic }: { topic: TopicMeta }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium">{topic.category}</Badge>
        <Badge className={`text-xs font-medium border ${statusColors[topic.status]}`}>
          {statusLabels[topic.status]}
        </Badge>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{topic.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0"
            style={{ backgroundColor: `hsl(${topic.author.color})` }}
          >
            {topic.author.avatar}
          </div>
          <span>{topic.author.name}</span>
          {topic.author.role && <span className="text-muted-foreground/60">· {topic.author.role}</span>}
        </span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{topic.participantCount} participants</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{topic.postCount} posts</span>
      </div>
    </div>
  );
}
