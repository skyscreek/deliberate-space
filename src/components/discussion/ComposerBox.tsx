import { GuidanceItem, ArgdownType } from '@/types/discussion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, X, Compass } from 'lucide-react';
import { useDiscussion } from '@/context/DiscussionContext';
import { useEffect, useRef } from 'react';

const argdownLabels: Record<string, string> = {
  evidence: '📊 Evidence', support: '✅ Support', objection: '❌ Objection',
  alternative: '🔄 Alternative', concern: '⚠️ Concern', rebuttal: '↩️ Rebuttal',
  question: '❓ Question', claim: '💬 Claim', proposal: '💡 Proposal',
};

export default function ComposerBox({ guidance }: { guidance: GuidanceItem[] }) {
  const { assistedComment, clearAssistedComment } = useDiscussion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (assistedComment && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [assistedComment]);

  return (
    <div id="composer-box" className="surface-card p-4 space-y-3">
      {assistedComment ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Assisted Contribution</p>
                <p className="text-xs text-muted-foreground mt-0.5">{assistedComment.label}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearAssistedComment}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{assistedComment.description}</p>
          {assistedComment.suggestedArgdownType && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Suggested type:</span>
              <span className="font-medium text-primary">
                {argdownLabels[assistedComment.suggestedArgdownType] || assistedComment.suggestedArgdownType}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Add your contribution</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
            AI will detect argument type
          </span>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder={assistedComment
          ? `Write your ${assistedComment.suggestedArgdownType || 'contribution'} here…`
          : 'Share your perspective, evidence, or questions…'
        }
        className="min-h-[100px] resize-y bg-accent/30 border-border/50 focus:border-primary/40"
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Your post will be automatically classified
        </p>
        <Button size="sm">Post</Button>
      </div>
    </div>
  );
}
