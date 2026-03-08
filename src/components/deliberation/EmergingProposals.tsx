import { EmergingProposal } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { useState } from 'react';

export default function EmergingProposals({ proposals }: { proposals: EmergingProposal[] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter, scrollToPost } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emerging Proposals</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-2">
        {proposals.map((p) => {
          const isActive = activeFilter?.type === 'proposal' && activeFilter.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (isActive) {
                  setFilter(null);
                } else {
                  setFilter({ type: 'proposal', id: p.id, relatedPostIds: p.relatedPostIds });
                  if (p.relatedPostIds[0]) scrollToPost(p.relatedPostIds[0]);
                }
              }}
              className={cn(
                'w-full text-left flex flex-col gap-1 glass-subtle rounded-lg p-2.5 transition-all duration-200 hover:ring-1 hover:ring-argdown-proposal/30',
                isActive && 'ring-2 ring-argdown-proposal/60 bg-argdown-proposal/10',
              )}
            >
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-argdown-proposal shrink-0" />
                <span className="text-xs font-semibold text-foreground/90">{p.title}</span>
              </div>
              <span className="text-[11px] text-foreground/70 leading-snug">{p.description}</span>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}