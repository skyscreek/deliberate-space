import { stubTopics, topicDeliberationPreviews } from '@/data/mockData';
import TopicCard from '@/components/TopicCard';
import { Sparkles, TrendingUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30 border-b">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground tracking-tight">Delibera</h1>
            </div>
            <span className="text-xs text-muted-foreground">Structured community discussion</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 space-y-4">
        {/* Active stats bar */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{stubTopics.length} active discussions</span>
          </span>
          <span>·</span>
          <span>{stubTopics.reduce((s, t) => s + t.participantCount, 0)} participants</span>
          <span>·</span>
          <span>{stubTopics.reduce((s, t) => s + t.postCount, 0)} contributions</span>
        </div>

        {/* Discussion feed */}
        <div className="surface-card overflow-hidden">
          <div className="divide-y divide-border/60">
            {stubTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} preview={topicDeliberationPreviews[topic.id]} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
