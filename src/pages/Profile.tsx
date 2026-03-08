import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProfile, useProfileByUsername, useProfileTopics, useProfilePosts, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import UserMenu from '@/components/UserMenu';
import { Sparkles, ArrowLeft, MapPin, Calendar, MessageSquare, FileText, ChevronUp, Loader2, Pencil, Settings, Activity, Mail, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-vote-up/10 text-vote-up border-vote-up/20' },
  'seeking-consensus': { label: 'Consensus', className: 'bg-highlight/10 text-highlight border-highlight/20' },
  resolved: { label: 'Resolved', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  // If viewing by username, look up profile by username; otherwise show own profile
  const { data: lookedUpProfile } = useProfileByUsername(username);
  const targetUserId = username ? lookedUpProfile?.user_id : currentUser?.id;

  const { data: profile, isLoading: profileLoading } = useProfile(targetUserId);
  const { data: topics } = useProfileTopics(targetUserId);
  const { data: posts } = useProfilePosts(targetUserId);

  const isOwnProfile = !username || currentUser?.id === targetUserId;

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

        {/* Tabs */}
        {isOwnProfile && currentUser ? (
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList className="w-full justify-start bg-card border border-border">
              <TabsTrigger value="activity" className="gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" /> Activity
              </TabsTrigger>
              <TabsTrigger value="edit" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs">
                <Settings className="h-3.5 w-3.5" /> Account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activity">
              <ActivitySection topics={topics} posts={posts} />
            </TabsContent>
            <TabsContent value="edit">
              <EditProfileSection profile={profile} userId={currentUser.id} />
            </TabsContent>
            <TabsContent value="settings">
              <AccountSettingsSection email={currentUser.email || ''} />
            </TabsContent>
          </Tabs>
        ) : (
          <ActivitySection topics={topics} posts={posts} />
        )}
      </main>
    </div>
  );
}

/* ─── Activity Section ─── */
function ActivitySection({ topics, posts }: { topics: any[] | undefined; posts: any[] | undefined }) {
  return (
    <div className="space-y-5">
      {topics && topics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-1">Topics started</h3>
          <div className="space-y-2">
            {topics.map(t => {
              const status = statusConfig[t.status] || statusConfig.active;
              return (
                <Link key={t.id} to={`/d/${t.slug}`} className="block">
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

      {posts && posts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground px-1">Recent contributions</h3>
          <div className="space-y-2">
            {posts.map(p => (
              <Link key={p.id} to={`/d/${(p as any).topics?.slug || p.topic_id}`} className="block">
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

      {(!topics || topics.length === 0) && (!posts || posts.length === 0) && (
        <div className="surface-card-elevated p-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Profile Section ─── */
function EditProfileSection({ profile, userId }: { profile: { display_name: string; bio: string | null; location: string | null }; userId: string }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Display name is required', variant: 'destructive' });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        userId,
        updates: {
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
        },
      });
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const hasChanges =
    displayName !== profile.display_name ||
    (bio || '') !== (profile.bio || '') ||
    (location || '') !== (profile.location || '');

  return (
    <div className="surface-card-elevated p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Edit Profile</h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Display Name</Label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bio</Label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell others about yourself, your interests, and perspectives…"
            rows={3}
            maxLength={500}
            className="resize-y"
          />
          <p className="text-[11px] text-muted-foreground text-right">{bio.length}/500</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Location</Label>
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City, Country"
            maxLength={100}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending || !hasChanges}>
          {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Account Settings Section ─── */
function AccountSettingsSection({ email }: { email: string }) {
  return (
    <div className="space-y-4">
      <ChangeEmailCard currentEmail={email} />
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}

function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast({ title: 'Confirmation sent', description: 'Check both your old and new email to confirm the change.' });
      setNewEmail('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card-elevated p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Email Address</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Current email: <span className="text-foreground font-medium">{currentEmail}</span>
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs">New Email</Label>
        <Input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="new@example.com"
          maxLength={255}
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleChangeEmail} disabled={loading || !newEmail.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Email'}
        </Button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Password updated' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card-elevated p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">New Password</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            maxLength={128}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Confirm Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            maxLength={128}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleChangePassword} disabled={loading || !password}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
        </Button>
      </div>
    </div>
  );
}

function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    try {
      // Call edge function for account deletion (needs service role)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      await signOut();
      navigate('/');
      toast({ title: 'Account deleted', description: 'Your account has been permanently removed.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete account.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="surface-card-elevated p-5 space-y-3 border-destructive/20">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="flex justify-end">
          <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
            Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account, profile, and all your posts. Type <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading || confirmText !== 'DELETE'}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Header ─── */
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
