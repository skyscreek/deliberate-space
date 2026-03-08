import { Tension } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import { cn } from '@/lib/utils';
import { Swords } from 'lucide-react';

export default function TensionCard({ tension }: { tension: Tension }) {
  const { activeFilter, setFilter } = useDiscussion();
  const isActive = activeFilter?.type === 'tension' && activeFilter.id === tension.id;

  const handleClick = () => {
    if (isActive) {
      setFilter(null);
    } else {
      setFilter({ type: 'tension', id: tension.id, relatedPostIds: tension.relatedPostIds });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-md border p-3 transition-all duration-200 hover:border-primary/40',
        isActive && 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400',
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Swords className="h-3.5 w-3.5 text-destructive/70" />
        <span className="text-xs font-semibold text-foreground">{tension.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-muted/50 p-2 text-muted-foreground">{tension.sideA}</div>
        <div className="rounded bg-muted/50 p-2 text-muted-foreground">{tension.sideB}</div>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-1.5">{tension.relatedPostIds.length} related posts</p>
    </button>
  );
}
