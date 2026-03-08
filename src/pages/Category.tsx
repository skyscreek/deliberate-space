import { useParams, Link } from 'react-router-dom';
import { stubTopics, topicDeliberationPreviews } from '@/data/mockData';
import TopicCard from '@/components/TopicCard';
import { ArrowLeft, Sparkles, Tag } from 'lucide-react';

export default function Category() {
  const { slug } = useParams();
  const categoryName = slug?.replace(/-/g, ' ') || '';

  const topics = stubTopics.filter(
    (t) => t.category.toLowerCase() === categoryName.toLowerCase()
  );

  // Get all unique categories for "related" section
  const allCategories = [...new Set(stubTopics.map((t) => t.category))];
  const otherCategories = allCategories.filter(
    (c) => c.toLowerCase() !== categoryName.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong sticky top-0 z-30 border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Delibera</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Category header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>Topic Category</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight capitalize">{categoryName}</h1>
          <p className="text-sm text-muted-foreground">
            {topics.length} {topics.length === 1 ? 'discussion' : 'discussions'} in this category
          </p>
        </div>

        {/* Discussions */}
        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} preview={topicDeliberationPreviews[topic.id]} />
            ))}
          </div>
        ) : (
          <div className="surface-card-elevated p-8 text-center">
            <p className="text-sm text-muted-foreground">No discussions found in this category.</p>
          </div>
        )}

        {/* Related categories */}
        {otherCategories.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explore other topics</h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => {
                const count = stubTopics.filter((t) => t.category === cat).length;
                return (
                  <Link
                    key={cat}
                    to={`/category/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className="surface-card-elevated px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition-all"
                  >
                    {cat}
                    <span className="text-xs text-muted-foreground ml-1.5">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
