import { ArgumentCluster } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function ClusterList({ clusters }: { clusters: ArgumentCluster[] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Argument Clusters</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {clusters.map((c) => {
          const isActive = activeFilter?.type === 'cluster' && activeFilter.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => isActive ? setFilter(null) : setFilter({ type: 'cluster', id: c.id, relatedPostIds: c.relatedPostIds })}
              className={cn(
                'w-full text-left rounded-md border p-3 transition-all duration-200 hover:border-primary/40',
                isActive && 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{c.postCount}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
