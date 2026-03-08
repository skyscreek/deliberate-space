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
          <div className="mx-auto max-w-3xl px-4 py-2.5 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-sm text-foreground">Delibera</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
          {/* Topic header — compact, collapsible prompt */}
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
          <div className="flex items-center gap-0.5 border-b border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px',
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground/50 hover:text-foreground hover:border-border/40',
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
            <>
              <ThreadView posts={topic.posts} />
              <ComposerBox guidance={topic.guidance} />
            </>
          )}
          {activeTab === 'overview' && (
            <OverviewView topic={topic} onSwitchToThread={handleSwitchToThread} />
          )}
          {activeTab === 'argument-map' && (
            <ArgumentMapView nodes={topic.argumentMap} onSwitchToThread={handleSwitchToThread} />
          )}
        </main>
      </div>
    </DiscussionProvider>
  );
}
