import { stubTopics } from '@/data/mockData';
import { topicDeliberationPreviews } from '@/data/mockData';
import TopicCard from '@/components/TopicCard';
import { Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground tracking-tight">Delibera</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">Structured deliberation on complex public topics.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-secondary/50 px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Discussions</h2>
          </div>
          <div className="divide-y">
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
