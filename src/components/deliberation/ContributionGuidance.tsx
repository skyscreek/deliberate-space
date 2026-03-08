import { GuidanceItem } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, Search, Eye, Lightbulb, MessageSquare, ArrowRightLeft, HelpCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const icons: Record<string, typeof AlertTriangle> = {
  overrepresented: AlertTriangle, 'evidence-needed': Search, 'missing-perspective': Eye,
  gap: Lightbulb, 'missing-counterargument': MessageSquare, 'missing-alternative': ArrowRightLeft,
  'unresolved-question': HelpCircle,
};

const colors: Record<string, string> = {
  overrepresented: 'text-argdown-concern', 'evidence-needed': 'text-argdown-proposal',
  'missing-perspective': 'text-argdown-alternative', gap: 'text-argdown-support',
  'missing-counterargument': 'text-argdown-objection', 'missing-alternative': 'text-argdown-alternative',
  'unresolved-question': 'text-argdown-question',
};

export default function ContributionGuidance({ items }: { items: GuidanceItem[] }) {
  const [open, setOpen] = useState(true);
  const { startAssistedComment } = useDiscussion();

  const handleClick = (item: GuidanceItem) => {
    startAssistedComment({
      guidanceId: item.id, targetPostId: item.targetPostId,
      label: item.label, description: item.description,
      suggestedArgdownType: item.suggestedArgdownType,
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contribute</h3>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-2">
        {items.map((item) => {
          const Icon = icons[item.type];
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="group w-full text-left flex items-start gap-2 rounded-md border border-border/40 bg-accent/20 p-2 text-xs transition-all hover:border-primary/30"
            >
              <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', colors[item.type])} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground leading-snug">{item.label}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
