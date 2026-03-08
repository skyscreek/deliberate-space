import { useParams, Link } from 'react-router-dom';
import { useProfile, useProfileTopics, useProfilePosts } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import UserMenu from '@/components/UserMenu';
import { Sparkles, ArrowLeft, MapPin, Calendar, MessageSquare, FileText, ChevronUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-vote-up/10 text-vote-up border-vote-up/20' },
  'seeking-consensus': { label: 'Consensus', className: 'bg-highlight/10 text-highlight border-highlight/20' },
  resolved: { label: 'Resolved', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.id;

  const { data: profile, isLoading: profileLoading } = useProfile(targetUserId);
  const { data: topics } = useProfileTopics(targetUserId);
  const { data: posts } = useProfilePosts(targetUserId);

  const isOwnProfile = currentUser?.id === targetUserId;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-muted-foreground">Profile not found.</p>
        </main>
      </div>
    );
  }

  const initials = profile.display_name
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        {/* Profile card */}
        <div className="surface-card-elevated p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground">{profile.display_name}</h2>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                </span>
                {topics && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {topics.length} topics
                  </span>
                )}
                {posts && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {posts.length} posts
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Topics */}
        {topics && topics.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground px-1">Topics started</h3>
            <div className="space-y-2">
              {topics.map(t => {
                const status = statusConfig[t.status] || statusConfig.active;
                return (
                  <Link key={t.id} to={`/discussion/${t.id}`} className="block">
                    <div className="surface-card-elevated p-4 hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">{t.title}</h4>
                        <Badge className={cn('text-[10px] border shrink-0 px-2 py-0.5', status.className)}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>{t.category}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent posts */}
        {posts && posts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground px-1">Recent contributions</h3>
            <div className="space-y-2">
              {posts.map(p => (
                <Link key={p.id} to={`/discussion/${p.topic_id}`} className="block">
                  <div className="surface-card-elevated p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <span className="text-primary font-medium truncate">
                        {(p as any).topics?.title || 'Discussion'}
                      </span>
                      {p.argdown_type && (
                        <span className="italic text-foreground/60">{p.argdown_type}</span>
                      )}
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      <span className="flex items-center gap-0.5 ml-auto">
                        <ChevronUp className="h-3 w-3" /> {p.score}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">{p.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="glass-strong sticky top-0 z-30 border-b">
      <div className="mx-auto max-w-3xl px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground tracking-tight">Delibera</h1>
            </div>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
