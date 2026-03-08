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
        'w-full text-left glass-subtle rounded-lg p-3 transition-all duration-200 hover:ring-1 hover:ring-primary/30',
        isActive && 'ring-2 ring-highlight bg-highlight-bg',
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Swords className="h-3.5 w-3.5 text-argdown-objection/70" />
        <span className="text-xs font-semibold text-foreground">{tension.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-accent/40 p-2 text-muted-foreground">{tension.sideA}</div>
        <div className="rounded-lg bg-accent/40 p-2 text-muted-foreground">{tension.sideB}</div>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-1.5">{tension.relatedPostIds.length} related posts</p>
    </button>
  );
}
