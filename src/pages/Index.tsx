import { stubTopics, topicDeliberationPreviews } from '@/data/mockData';
import TopicCard from '@/components/TopicCard';
import UserMenu from '@/components/UserMenu';
import { Sparkles, TrendingUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong sticky top-0 z-30 border-b">
        <div className="mx-auto max-w-3xl px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground tracking-tight">Delibera</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground hidden sm:block">Structured community discussion</span>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{stubTopics.length} active discussions</span>
          </span>
          <span className="text-border">·</span>
          <span>{stubTopics.reduce((s, t) => s + t.participantCount, 0)} participants</span>
          <span className="text-border">·</span>
          <span>{stubTopics.reduce((s, t) => s + t.postCount, 0)} contributions</span>
        </div>

        <div className="space-y-3">
          {stubTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} preview={topicDeliberationPreviews[topic.id]} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
