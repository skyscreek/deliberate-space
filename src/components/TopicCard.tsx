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
      className="block group"
    >
      <div className="surface-card-elevated p-5 hover:border-primary/30 transition-all">
        {/* Top row: category + status */}
        <div className="flex items-center justify-between mb-2.5">
          <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 border-border">{topic.category}</Badge>
          <Badge className={cn('text-[10px] border shrink-0 px-2 py-0.5', status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
          {topic.title}
        </h3>

        {/* Deliberation preview */}
        {preview && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {preview.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0"
              style={{ backgroundColor: `hsl(${topic.author.color})` }}
            />
            <span className="font-medium text-foreground/80">{topic.author.name}</span>
          </span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{topic.participantCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{topic.postCount} posts</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(topic.lastActivity), { addSuffix: true })}
          </span>
        </div>

        {/* Deliberation pulse */}
        {preview && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-argdown-objection" />
              <span className="font-medium text-foreground/70">{preview.tensions}</span> tensions
            </span>
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-argdown-question" />
              <span className="font-medium text-foreground/70">{preview.openQuestions}</span> open questions
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
