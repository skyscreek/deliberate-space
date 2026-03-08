import { TopicMeta } from '@/types/discussion';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Swords, HelpCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-vote-up/10 text-vote-up border-vote-up/20' },
  'seeking-consensus': { label: 'Consensus', className: 'bg-highlight/10 text-highlight border-highlight/20' },
  resolved: { label: 'Resolved', className: 'bg-primary/10 text-primary border-primary/20' },
};

interface TopicCardProps {
  topic: TopicMeta;
  preview?: { tensions: number; openQuestions: number; topCluster: string; summary: string };
}

export default function TopicCard({ topic, preview }: TopicCardProps) {
  const href = topic.id === 'topic-1' ? '/discussion/topic-1' : '#';
  const status = statusConfig[topic.status];

  return (
    <Link
      to={href}
      className="flex gap-4 px-4 py-3.5 hover:bg-accent/50 transition-colors group"
    >
      {/* Vote/post count column */}
      <div className="flex flex-col items-center justify-start pt-1 min-w-[2.5rem] shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">{topic.postCount}</span>
        <span className="text-[10px] text-muted-foreground">posts</span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors flex-1 min-w-0">
            {topic.title}
          </h3>
          <Badge className={cn('text-[10px] border shrink-0 px-1.5 py-0', status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 border-border/60">{topic.category}</Badge>
          <span className="flex items-center gap-1">
            <div
              className="h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-primary-foreground shrink-0"
              style={{ backgroundColor: `hsl(${topic.author.color})` }}
            />
            {topic.author.name}
          </span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participantCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.postCount}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(topic.lastActivity), { addSuffix: true })}
          </span>
        </div>

        {/* Deliberation preview */}
        {preview && (
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 text-argdown-objection/60" />
              {preview.tensions} tensions
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-argdown-question/70" />
              {preview.openQuestions} open
            </span>
            <span className="text-border">·</span>
            <span className="truncate italic text-muted-foreground/70 flex-1 min-w-0">{preview.summary}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
