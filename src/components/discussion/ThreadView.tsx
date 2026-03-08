import { Post } from '@/types/discussion';
import { useDiscussion } from '@/context/DiscussionContext';
import PostCard from './PostCard';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThreadView({ posts }: { posts: Post[] }) {
  const { activeFilter, setFilter } = useDiscussion();

  return (
    <div className="space-y-3">
      {activeFilter && (
        <div className="flex items-center gap-2 rounded-lg border border-highlight bg-highlight-bg px-3 py-2 text-sm shadow-sm">
          <span className="text-foreground">
            Showing posts related to: <strong>{activeFilter.type}</strong> — {activeFilter.relatedPostIds.length} posts highlighted
          </span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setFilter(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
