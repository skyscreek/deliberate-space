import { useParams } from 'react-router-dom';
import { congestionTopic } from '@/data/mockData';
import { DiscussionProvider } from '@/context/DiscussionContext';
import TopicHeader from '@/components/discussion/TopicHeader';
import ProposalPrompt from '@/components/discussion/ProposalPrompt';
import ThreadView from '@/components/discussion/ThreadView';
import ComposerBox from '@/components/discussion/ComposerBox';
import DeliberationSidebar from '@/components/deliberation/DeliberationSidebar';
import { Sparkles, ArrowLeft, PanelRightOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Discussion() {
  const { id } = useParams();
  // For now, only topic-1 has full data
  const topic = congestionTopic;

  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
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
                  Deliberation
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px] p-0">
                <SheetTitle className="sr-only">Deliberation Panel</SheetTitle>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold text-foreground">Deliberation Layer</h2>
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

        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* Topic header + proposal — full width */}
          <div className="max-w-4xl space-y-4 mb-6">
            <TopicHeader topic={topic} />
            <ProposalPrompt text={topic.proposal} />
          </div>

          {/* Two-column layout */}
          <div className="flex gap-6 items-start">
            {/* Thread — dominant */}
            <div className="flex-1 min-w-0 space-y-6">
              <ThreadView posts={topic.posts} />
              <ComposerBox guidance={topic.guidance} />
            </div>

            {/* Sidebar — desktop only */}
            <aside className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-20">
              <div className="rounded-lg border bg-card/50 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Deliberation Layer</h2>
                <ScrollArea className="max-h-[calc(100vh-140px)]">
                  <DeliberationSidebar topic={topic} />
                </ScrollArea>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </DiscussionProvider>
  );
}
