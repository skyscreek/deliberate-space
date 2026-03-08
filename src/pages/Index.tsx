import { stubTopics } from '@/data/mockData';
import TopicCard from '@/components/TopicCard';
import { Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">Delibera</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Discussions you can actually follow. Structured deliberation on complex public topics.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Active Discussions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stubTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
