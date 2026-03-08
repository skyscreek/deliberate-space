import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopicRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  proposal: string | null;
  slug: string;
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
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!topics || topics.length === 0) return [];

  // Fetch author profiles
  const authorIds = [...new Set(topics.map(t => t.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', authorIds);

  const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  for (const p of profiles || []) {
    profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
  }

  // Fetch post stats
  const { data: postStats } = await supabase
    .from('posts')
    .select('topic_id, author_id, created_at');

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

  return topics.map(t => {
    const stats = statsMap.get(t.id);
    return {
      ...t,
      author_profile: profileMap.get(t.author_id),
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

async function fetchTopicBySlug(slug: string): Promise<TopicRow> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', data.author_id)
    .single();

  return {
    ...data,
    slug: data.slug ?? '',
    author_profile: profile ? { display_name: profile.display_name, avatar_url: profile.avatar_url } : undefined,
  };
}

export function useTopic(slug: string | undefined) {
  return useQuery({
    queryKey: ['topic', slug],
    queryFn: () => fetchTopicBySlug(slug!),
    enabled: !!slug,
  });
}
