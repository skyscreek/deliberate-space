import { Sparkles } from 'lucide-react';

export default function DiscussionSummary({ summary }: { summary: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discussion Summary</h3>
      </div>
      <p className="text-sm leading-relaxed text-foreground/80">{summary}</p>
    </div>
  );
}
