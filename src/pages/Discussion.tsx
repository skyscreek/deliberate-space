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
import { Sparkles, ArrowLeft, PanelRightOpen, X, MessageSquare, BarChart3, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ViewTab = 'thread' | 'overview' | 'argument-map';

export default function Discussion() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<ViewTab>('thread');
  const topic = congestionTopic;

  const tabs: { id: ViewTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'thread', label: 'Thread', icon: MessageSquare },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'argument-map', label: 'Argument Map', icon: GitBranch },
  ];

  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm text-foreground">Delibera</span>
            </Link>

            {/* Mobile sidebar trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto lg:hidden">
                  <PanelRightOpen className="h-4 w-4 mr-1" />
                  Clusters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <SheetTitle className="sr-only">Deliberation Panel</SheetTitle>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold text-foreground">Discussion Insights</h2>
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

        <main className="mx-auto max-w-6xl px-4 py-6">
          {/* Topic header + proposal — full width */}
          <div className="max-w-3xl space-y-4 mb-4">
            <TopicHeader topic={topic} />
            <ProposalPrompt text={topic.proposal} />
          </div>

          {/* Discussion Overview — above thread, full main column width */}
          <div className="max-w-3xl mb-4">
            <DiscussionOverview
              summary={topic.summary}
              tensions={topic.tensions}
              openQuestions={topic.openQuestions}
            />
          </div>

          {/* View tabs */}
          <div className="max-w-3xl mb-4">
            <div className="flex items-center gap-1 border-b">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                      activeTab === tab.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-6 items-start">
            {/* Main column */}
            <div className="flex-1 min-w-0 max-w-3xl space-y-6">
              {activeTab === 'thread' && (
                <>
                  <ThreadView posts={topic.posts} />
                  <ComposerBox guidance={topic.guidance} />
                </>
              )}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A structured overview of the discussion showing all key positions, tensions, clusters, and emerging proposals in one place.
                  </p>
                  {/* Reuse overview but always expanded */}
                  <DiscussionOverview
                    summary={topic.summary}
                    tensions={topic.tensions}
                    openQuestions={topic.openQuestions}
                  />
                </div>
              )}
              {activeTab === 'argument-map' && (
                <ArgumentMapView nodes={topic.argumentMap} />
              )}
            </div>

            {/* Sidebar — slim, supportive, desktop only */}
            <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
              <div className="rounded-lg border bg-card/50 p-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Discussion Insights</h2>
                <DeliberationSidebar topic={topic} />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </DiscussionProvider>
  );
}
