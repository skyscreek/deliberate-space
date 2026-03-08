import { TopicMeta } from '@/types/discussion';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active Discussion', className: 'bg-vote-up/10 text-vote-up border-vote-up/20' },
  'seeking-consensus': { label: 'Seeking Consensus', className: 'bg-highlight/10 text-highlight border-highlight/20' },
  resolved: { label: 'Resolved', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function TopicHeader({ topic }: { topic: TopicMeta }) {
  const status = statusConfig[topic.status];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium border-border/60">{topic.category}</Badge>
        <Badge className={`text-xs font-medium border ${status.className}`}>
          {status.label}
        </Badge>
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{topic.title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0"
            style={{ backgroundColor: `hsl(${topic.author.color})` }}
          >
            {topic.author.avatar}
          </div>
          <span className="font-medium text-foreground">{topic.author.name}</span>
          {topic.author.role && <span className="text-muted-foreground/70">· {topic.author.role}</span>}
        </span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{topic.participantCount} participants</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{topic.postCount} posts</span>
      </div>
    </div>
  );
}
