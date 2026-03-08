import { FileText } from 'lucide-react';

export default function ProposalPrompt({ text }: { text: string }) {
  return (
    <div className="surface-card border-l-4 border-l-primary overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Discussion Prompt</p>
            {text.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">{para}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
