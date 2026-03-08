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
import DeliberationSidebar from '@/components/deliberation/DeliberationSidebar';
import { ArrowLeft, PanelRightOpen, X, MessageSquare, GitBranch, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ViewTab = 'thread' | 'argument-map';

export default function Discussion() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<ViewTab>('thread');
  const topic = congestionTopic;

  const tabs: { id: ViewTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'thread', label: 'Discussion', icon: MessageSquare },
    { id: 'argument-map', label: 'Argument Map', icon: GitBranch },
  ];

  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-30 border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Delibera</span>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto lg:hidden">
                  <PanelRightOpen className="h-4 w-4 mr-1" />
                  Insights
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 bg-card">
                <SheetTitle className="sr-only">Discussion Insights</SheetTitle>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold text-foreground">Insights</h2>
                  <SheetClose asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><X className="h-4 w-4" /></Button>
                  </SheetClose>
                </div>
                <ScrollArea className="h-[calc(100vh-52px)]">
                  <div className="p-4">
                    <DeliberationSidebar topic={topic} />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex gap-6 items-start">
            {/* Main column */}
            <div className="flex-1 min-w-0 max-w-3xl space-y-5">
              {/* 1. Topic header */}
              <TopicHeader topic={topic} />

              {/* 2. Proposal / discussion prompt */}
              <ProposalPrompt text={topic.proposal} />

              {/* 3. Discussion insights (above thread) */}
              <DiscussionOverview
                summary={topic.summary}
                tensions={topic.tensions}
                openQuestions={topic.openQuestions}
                guidance={topic.guidance}
              />

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

              {/* 4. Main thread / argument map */}
              {activeTab === 'thread' && (
                <>
                  <ThreadView posts={topic.posts} />
                  <ComposerBox guidance={topic.guidance} />
                </>
              )}
              {activeTab === 'argument-map' && (
                <ArgumentMapView nodes={topic.argumentMap} />
              )}
            </div>

            {/* Sidebar — light supportive role */}
            <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
              <DeliberationSidebar topic={topic} />
            </aside>
          </div>
        </main>
      </div>
    </DiscussionProvider>
  );
}
