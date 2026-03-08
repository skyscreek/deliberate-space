import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopicRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  proposal: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  canonical_topic_id: string | null;
  author_profile?: { display_name: string; avatar_url: string | null };
  post_count?: number;
  participant_count?: number;
  last_activity?: string;
}

async function fetchTopics(): Promise<TopicRow[]> {
  // Fetch topics with author profile
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*, profiles!inner(display_name, avatar_url)')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Fetch post counts and participant counts per topic
  const topicIds = (topics || []).map(t => t.id);
  
  if (topicIds.length === 0) return [];

  // Get post counts and distinct authors per topic
  const { data: postStats, error: postError } = await supabase
    .from('posts')
    .select('topic_id, author_id, created_at');

  if (postError) throw postError;

  const statsMap = new Map<string, { postCount: number; participants: Set<string>; lastActivity: string }>();
  for (const p of postStats || []) {
    if (!statsMap.has(p.topic_id)) {
      statsMap.set(p.topic_id, { postCount: 0, participants: new Set(), lastActivity: p.created_at });
    }
    const s = statsMap.get(p.topic_id)!;
    s.postCount++;
    s.participants.add(p.author_id);
    if (p.created_at > s.lastActivity) s.lastActivity = p.created_at;
  }

  return (topics || []).map(t => {
    const profile = (t as any).profiles;
    const stats = statsMap.get(t.id);
    return {
      ...t,
      author_profile: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : undefined,
      post_count: stats?.postCount ?? 0,
      participant_count: stats?.participants.size ?? 0,
      last_activity: stats?.lastActivity ?? t.updated_at,
    };
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
  });
}

async function fetchTopic(id: string) {
  const { data, error } = await supabase
    .from('topics')
    .select('*, profiles!inner(display_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  const profile = (data as any).profiles;
  return {
    ...data,
    author_profile: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : undefined,
  } as TopicRow;
}

export function useTopic(id: string | undefined) {
  return useQuery({
    queryKey: ['topic', id],
    queryFn: () => fetchTopic(id!),
    enabled: !!id,
  });
}
