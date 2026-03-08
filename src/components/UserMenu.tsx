import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />;

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <LogIn className="h-3 w-3" />
          Sign in
        </Button>
      </Link>
    );
  }

  const initials = (profile?.display_name || user.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
        {initials}
      </div>
      <span className="text-xs font-medium text-foreground hidden sm:block max-w-[100px] truncate">
        {profile?.display_name || user.email}
      </span>
      <button
        onClick={signOut}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
