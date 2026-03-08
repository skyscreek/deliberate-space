import { OpenQuestion } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function OpenQuestions({ questions }: { questions: OpenQuestion[] }) {
  const [open, setOpen] = useState(true);
  const { activeFilter, setFilter, scrollToPost } = useDiscussion();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Questions</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-2">
        {questions.map((q) => {
          const isActive = activeFilter?.type === 'question' && activeFilter.id === q.id;
          return (
            <button
              key={q.id}
              onClick={() => {
                if (isActive) {
                  setFilter(null);
                } else {
                  setFilter({ type: 'question', id: q.id, relatedPostIds: q.relatedPostIds });
                  scrollToPost(q.raisedInPostId);
                }
              }}
              className={cn(
                'w-full text-left flex items-start gap-2 rounded-md border p-2.5 text-xs transition-all duration-200 hover:border-primary/40',
                isActive && 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400',
              )}
            >
              <HelpCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
              <span className="text-foreground/80">{q.question}</span>
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
