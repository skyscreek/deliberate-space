import { ArgumentCluster } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Layers } from 'lucide-react';
import { useState } from 'react';

export default function ClusterList({ clusters }: { clusters: ArgumentCluster[] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Clusters</h3>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-2">
        {clusters.map((c) => {
          const isActive = activeFilter?.type === 'cluster' && activeFilter.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => isActive ? setFilter(null) : setFilter({ type: 'cluster', id: c.id, relatedPostIds: c.relatedPostIds })}
              className={cn(
                'w-full text-left rounded-md border border-border/40 bg-accent/20 p-2.5 text-xs transition-all hover:border-primary/30',
                isActive && 'ring-1 ring-highlight/60 bg-highlight-bg border-highlight/30',
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Layers className="h-3 w-3 text-primary/50" />
                <span className="font-semibold text-foreground">{c.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{c.postCount}</span>
              </div>
              <p className="text-muted-foreground leading-snug">{c.description}</p>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
