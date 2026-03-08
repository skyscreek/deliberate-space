import { useTopics, TopicRow } from '@/hooks/useTopics';
import { useCreateTopic } from '@/hooks/useCreateTopic';
import { useAuth } from '@/context/AuthContext';
import UserMenu from '@/components/UserMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, MessageSquare, Users, Clock, Plus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-vote-up/10 text-vote-up border-vote-up/20' },
  'seeking-consensus': { label: 'Consensus', className: 'bg-highlight/10 text-highlight border-highlight/20' },
  resolved: { label: 'Resolved', className: 'bg-primary/10 text-primary border-primary/20' },
};

const categories = ['General', 'Urban Policy', 'Education', 'Housing', 'Technology', 'Infrastructure', 'Public Services', 'Public Safety', 'Urban Planning'];

function TopicCardLive({ topic }: { topic: TopicRow }) {
  const status = statusConfig[topic.status] || statusConfig.active;
  const authorName = topic.author_profile?.display_name || 'Unknown';
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Link to={`/discussion/${topic.id}`} className="block group">
      <div className="surface-card-elevated p-5 hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-primary">{topic.category}</span>
          <Badge className={cn('text-[10px] border shrink-0 px-2 py-0.5', status.className)}>
            {status.label}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
          {topic.title}
        </h3>
        {topic.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{topic.description}</p>
        )}
        <div className="flex items-center gap-3.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground bg-primary shrink-0">
              {initials}
            </div>
            <span className="font-medium text-foreground/80">{authorName}</span>
          </span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{topic.participant_count}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{topic.post_count} posts</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(topic.last_activity || topic.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CreateTopicDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [proposal, setProposal] = useState('');
  const createTopic = useCreateTopic();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'You need to sign in to create a topic.', variant: 'destructive' });
      return;
    }
    try {
      const data = await createTopic.mutateAsync({ title, description, category, proposal });
      setOpen(false);
      setTitle(''); setDescription(''); setCategory('General'); setProposal('');
      navigate(`/discussion/${data.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a new discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What should we discuss?" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief context for the discussion" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Proposal (optional)</Label>
            <Textarea value={proposal} onChange={e => setProposal(e.target.value)} placeholder="What specific proposal or question should be debated?" rows={3} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createTopic.isPending}>
              {createTopic.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Topic'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const Index = () => {
  const { data: topics, isLoading, error } = useTopics();

  const totalPosts = topics?.reduce((s, t) => s + (t.post_count || 0), 0) ?? 0;
  const totalParticipants = topics?.reduce((s, t) => s + (t.participant_count || 0), 0) ?? 0;

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
              <CreateTopicDialog />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{topics?.length ?? 0} active discussions</span>
          </span>
          <span className="text-border">·</span>
          <span>{totalParticipants} participants</span>
          <span className="text-border">·</span>
          <span>{totalPosts} contributions</span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="surface-card-elevated p-8 text-center">
            <p className="text-sm text-destructive">Failed to load topics. Please try again.</p>
          </div>
        )}

        {!isLoading && topics?.length === 0 && (
          <div className="surface-card-elevated p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No discussions yet. Be the first to start one!</p>
          </div>
        )}

        <div className="space-y-3">
          {topics?.map((topic) => (
            <TopicCardLive key={topic.id} topic={topic} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
