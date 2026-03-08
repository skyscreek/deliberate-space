import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ProposalPrompt({ text }: { text: string }) {
  return (
    <Card className="border-l-4 border-l-primary bg-card">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 mt-0.5 text-primary shrink-0" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discussion Prompt</p>
            {text.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-card-foreground">{para}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
