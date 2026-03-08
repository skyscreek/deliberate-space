import { useState } from 'react';
import { TopicMeta } from '@/types/discussion';
import { Users, MessageSquare, Clock, ChevronDown, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-vote-up' },
  'seeking-consensus': { label: 'Seeking Consensus', className: 'text-highlight' },
  resolved: { label: 'Resolved', className: 'text-primary' },
};

export default function TopicHeader({ topic }: { topic: TopicMeta }) {
  const [open, setOpen] = useState(false);
  const status = statusConfig[topic.status];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        {/* Category + status row */}
        <div className="flex items-center gap-2 text-xs">
          <button className="inline-flex items-center gap-1 text-primary/70 hover:text-primary transition-colors font-medium">
            <Search className="h-3 w-3" />
            {topic.category}
          </button>
          <span className="text-muted-foreground/30">·</span>
          <span className={cn('font-medium', status.className)}>{status.label}</span>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold tracking-tight text-foreground leading-snug">{topic.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
          <span className="flex items-center gap-1.5">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0"
              style={{ backgroundColor: `hsl(${topic.author.color})` }}
            >
              {topic.author.avatar}
            </div>
            <span className="text-foreground/70">{topic.author.name}</span>
          </span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{topic.participantCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{topic.postCount} posts</span>
        </div>

        {/* Collapsible prompt */}
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors pt-1">
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
          {open ? 'Hide discussion prompt' : 'Show discussion prompt'}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="rounded-md bg-accent/40 px-3 py-2.5 mt-1">
            {topic.proposal.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-foreground/75 mb-1.5 last:mb-0">{para}</p>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
