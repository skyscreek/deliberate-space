import { GuidanceItem } from '@/types/discussion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, Search, Eye, Lightbulb } from 'lucide-react';
import { useState } from 'react';

const icons = {
  overrepresented: AlertTriangle,
  'evidence-needed': Search,
  'missing-perspective': Eye,
  gap: Lightbulb,
};

const colors = {
  overrepresented: 'text-amber-500',
  'evidence-needed': 'text-blue-500',
  'missing-perspective': 'text-purple-500',
  gap: 'text-emerald-500',
};

export default function ContributionGuidance({ items }: { items: GuidanceItem[] }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where to Contribute</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {items.map((item) => {
          const Icon = icons[item.type];
          return (
            <div key={item.id} className="flex items-start gap-2 rounded-md border p-2.5">
              <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colors[item.type]}`} />
              <div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
