import { GuidanceItem } from '@/types/discussion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, Search, Eye } from 'lucide-react';

const guidanceIcons = {
  overrepresented: AlertTriangle,
  'evidence-needed': Search,
  'missing-perspective': Eye,
  gap: Lightbulb,
};

const guidanceColors = {
  overrepresented: 'text-amber-600 dark:text-amber-400',
  'evidence-needed': 'text-blue-600 dark:text-blue-400',
  'missing-perspective': 'text-purple-600 dark:text-purple-400',
  gap: 'text-emerald-600 dark:text-emerald-400',
};

export default function ComposerBox({ guidance }: { guidance: GuidanceItem[] }) {
  // Pick the most useful guidance to show
  const featured = guidance.find(g => g.type === 'missing-perspective' || g.type === 'evidence-needed') ?? guidance[0];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Add your contribution</h3>

      {featured && (
        <div className={`flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs`}>
          {(() => {
            const Icon = guidanceIcons[featured.type];
            return <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${guidanceColors[featured.type]}`} />;
          })()}
          <div>
            <p className="font-medium text-foreground">{featured.label}</p>
            <p className="text-muted-foreground mt-0.5">{featured.description}</p>
          </div>
        </div>
      )}

      <Textarea placeholder="Share your perspective, evidence, or questions…" className="min-h-[100px] resize-y" />
      <div className="flex justify-end">
        <Button size="sm">Post contribution</Button>
      </div>
    </div>
  );
}
