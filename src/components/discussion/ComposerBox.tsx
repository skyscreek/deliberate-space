import { GuidanceItem } from '@/types/discussion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, Search, Eye, MessageSquare, ArrowRightLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const guidanceIcons: Record<string, typeof Lightbulb> = {
  overrepresented: AlertTriangle,
  'evidence-needed': Search,
  'missing-perspective': Eye,
  gap: Lightbulb,
  'missing-counterargument': MessageSquare,
  'missing-alternative': ArrowRightLeft,
  'unresolved-question': HelpCircle,
};

const guidanceColors: Record<string, string> = {
  overrepresented: 'text-amber-600 dark:text-amber-400',
  'evidence-needed': 'text-blue-600 dark:text-blue-400',
  'missing-perspective': 'text-violet-600 dark:text-violet-400',
  gap: 'text-emerald-600 dark:text-emerald-400',
  'missing-counterargument': 'text-destructive',
  'missing-alternative': 'text-violet-600 dark:text-violet-400',
  'unresolved-question': 'text-amber-500',
};

export default function ComposerBox({ guidance }: { guidance: GuidanceItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const featured = guidance.filter(g => g.type !== 'overrepresented').slice(0, 2);
  const rest = guidance.filter(g => !featured.includes(g));

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Add your contribution</h3>

      {/* Context-aware guidance */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Where this discussion needs help</p>
        {featured.map((item) => {
          const Icon = guidanceIcons[item.type] || Lightbulb;
          return (
            <div key={item.id} className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
              <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', guidanceColors[item.type])} />
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
          );
        })}

        {rest.length > 0 && (
          <Collapsible open={showAll} onOpenChange={setShowAll}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1">
              <ChevronDown className={cn('h-3 w-3 transition-transform', showAll && 'rotate-180')} />
              {showAll ? 'Show less' : `${rest.length} more suggestions`}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 pt-1">
              {rest.map((item) => {
                const Icon = guidanceIcons[item.type] || Lightbulb;
                return (
                  <div key={item.id} className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs">
                    <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', guidanceColors[item.type])} />
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Textarea placeholder="Share your perspective, evidence, or questions…" className="min-h-[100px] resize-y" />
      <div className="flex justify-end">
        <Button size="sm">Post contribution</Button>
      </div>
    </div>
  );
}
