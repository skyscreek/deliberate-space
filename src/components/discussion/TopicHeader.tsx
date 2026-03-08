import { useState } from 'react';
import { TopicMeta } from '@/types/discussion';
import { Users, MessageSquare, Clock, ChevronDown, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-vote-up font-semibold' },
  'seeking-consensus': { label: 'Seeking Consensus', className: 'text-highlight font-semibold' },
  resolved: { label: 'Resolved', className: 'text-primary font-semibold' },
};

export default function TopicHeader({ topic }: { topic: TopicMeta }) {
  const [open, setOpen] = useState(true);
  const status = statusConfig[topic.status];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="space-y-2.5">
        {/* Category + status row */}
        <div className="flex items-center gap-2.5 text-xs">
          <button className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-semibold">
            <Search className="h-3 w-3" />
            {topic.category}
          </button>
          <span className="text-border">·</span>
          <span className={cn('text-xs', status.className)}>{status.label}</span>
        </div>

        {/* Title — strong focal point */}
        <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug">{topic.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0"
              style={{ backgroundColor: `hsl(${topic.author.color})` }}
            >
              {topic.author.avatar}
            </div>
            <span className="font-medium text-foreground/80">{topic.author.name}</span>
          </span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participantCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.postCount} posts</span>
        </div>

        {/* Collapsible prompt */}
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5">
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
          {open ? 'Hide topic' : 'Show topic'}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="rounded-md bg-card px-3.5 py-3 mt-1 border border-border/40">
            {topic.proposal.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-1.5 last:mb-0">{para}</p>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
