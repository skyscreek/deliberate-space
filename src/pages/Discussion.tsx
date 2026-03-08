import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { congestionTopic } from '@/data/mockData';
import { DiscussionProvider } from '@/context/DiscussionContext';
import TopicHeader from '@/components/discussion/TopicHeader';
import DiscussionOverview from '@/components/discussion/DiscussionOverview';
import ThreadView from '@/components/discussion/ThreadView';
import ComposerBox from '@/components/discussion/ComposerBox';
import ArgumentMapView from '@/components/discussion/ArgumentMapView';
import OverviewView from '@/components/discussion/OverviewView';
import { ArrowLeft, MessageSquare, GitBranch, BarChart3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ViewTab = 'thread' | 'overview' | 'argument-map';

export default function Discussion() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<ViewTab>('thread');
  const [argTypeFilter, setArgTypeFilter] = useState<string | undefined>(undefined);
  const topic = congestionTopic;

  const tabs: { id: ViewTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'thread', label: 'Discussion', icon: MessageSquare },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'argument-map', label: 'Arguments', icon: GitBranch },
  ];

  const handleSwitchToThread = (postId: string) => {
    setActiveTab('thread');
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-30 border-b">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Delibera</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-5 space-y-5">
          {/* Topic header */}
          <TopicHeader topic={topic} />

          {/* Discussion insights — only on thread tab */}
          {activeTab === 'thread' && (
            <DiscussionOverview
              summary={topic.summary}
              tensions={topic.tensions}
              openQuestions={topic.openQuestions}
              guidance={topic.guidance}
            />
          )}

          {/* View tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px',
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main content by tab */}
          {activeTab === 'thread' && (
            <div className="space-y-4">
              <ThreadView posts={topic.posts} />
              <ComposerBox guidance={topic.guidance} />
            </div>
          )}
          {activeTab === 'overview' && (
            <OverviewView topic={topic} onSwitchToThread={handleSwitchToThread} onSwitchToArgType={(type) => { setArgTypeFilter(type); setActiveTab('argument-map'); }} />
          )}
          {activeTab === 'argument-map' && (
            <ArgumentMapView nodes={topic.argumentMap} onSwitchToThread={handleSwitchToThread} initialFilter={argTypeFilter} />
          )}
        </main>
      </div>
    </DiscussionProvider>
  );
}
