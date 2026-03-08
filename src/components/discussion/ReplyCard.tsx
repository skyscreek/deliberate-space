import { Reply } from '@/types/discussion';
import { formatDistanceToNow } from 'date-fns';

const reactionEmoji = { support: '👍', nuance: '🤔', disagree: '❗' };

export default function ReplyCard({ reply }: { reply: Reply }) {
  return (
    <div className="py-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-base">{reply.author.avatar}</span>
        <span className="font-medium text-xs text-foreground">{reply.author.name}</span>
        {reply.author.role && <span className="text-xs text-muted-foreground">{reply.author.role}</span>}
        <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">{reply.content}</p>
      <div className="mt-2 flex items-center gap-2">
        {reply.reactions.map((r) => r.count > 0 && (
          <button key={r.type} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted transition-colors">
            <span>{reactionEmoji[r.type]}</span>
            <span className="text-muted-foreground">{r.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
