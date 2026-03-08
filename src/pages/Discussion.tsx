import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { congestionTopic } from '@/data/mockData';
import { DiscussionProvider } from '@/context/DiscussionContext';
import TopicHeader from '@/components/discussion/TopicHeader';
import ProposalPrompt from '@/components/discussion/ProposalPrompt';
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
    { id: 'argument-map', label: 'Argument Map', icon: GitBranch },
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

        <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
          {/* 1. Topic header */}
          <TopicHeader topic={topic} />

          {/* 2. Proposal / discussion prompt */}
          <ProposalPrompt text={topic.proposal} />

          {/* 3. Discussion insights — only on thread tab, collapsible accordion */}
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
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 4. Main content by tab */}
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
