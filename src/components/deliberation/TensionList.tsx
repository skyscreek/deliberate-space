import { Tension } from '@/types/discussion';
import TensionCard from './TensionCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function TensionList({ tensions }: { tensions: Tension[] }) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Tensions</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {tensions.map((t) => (
          <TensionCard key={t.id} tension={t} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
