import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface PostRow {
  id: string;
  topic_id: string;
  parent_post_id: string | null;
  author_id: string;
  content: string;
  argdown_type: string | null;
  score: number;
  depth: number;
  created_at: string;
  updated_at: string;
  author_profile?: { display_name: string; avatar_url: string | null };
  children?: PostRow[];
}

async function fetchPosts(topicId: string): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Fetch all author profiles for these posts
  const authorIds = [...new Set((data || []).map(p => p.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', authorIds);

  const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  for (const p of profiles || []) {
    profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
  }

  const postsWithProfiles = (data || []).map(p => ({
    ...p,
    author_profile: profileMap.get(p.author_id),
  }));

  // Build tree structure
  const postMap = new Map<string, PostRow & { children: PostRow[] }>();
  const roots: PostRow[] = [];

  for (const p of postsWithProfiles) {
    postMap.set(p.id, { ...p, children: [] });
  }

  for (const p of postsWithProfiles) {
    const node = postMap.get(p.id)!;
    if (p.parent_post_id && postMap.has(p.parent_post_id)) {
      postMap.get(p.parent_post_id)!.children.push(node);
    } else if (!p.parent_post_id) {
      roots.push(node);
    }
  }

  return roots;
}

export function usePosts(topicId: string | undefined) {
  return useQuery({
    queryKey: ['posts', topicId],
    queryFn: () => fetchPosts(topicId!),
    enabled: !!topicId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ topicId, content, parentPostId, argdownType }: {
      topicId: string;
      content: string;
      parentPostId?: string;
      argdownType?: string;
    }) => {
      if (!user) throw new Error('Must be signed in to post');

      // Calculate depth
      let depth = 0;
      if (parentPostId) {
        const { data: parent } = await supabase
          .from('posts')
          .select('depth')
          .eq('id', parentPostId)
          .single();
        depth = (parent?.depth ?? 0) + 1;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          topic_id: topicId,
          content,
          author_id: user.id,
          parent_post_id: parentPostId || null,
          argdown_type: argdownType as any || null,
          depth,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts', data.topic_id] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, value, topicId }: { postId: string; value: 1 | -1; topicId: string }) => {
      if (!user) throw new Error('Must be signed in to vote');

      // Check if user already voted
      const { data: existing } = await supabase
        .from('votes')
        .select('id, value')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.value === value) {
          // Remove vote
          await supabase.from('votes').delete().eq('id', existing.id);
        } else {
          // Change vote
          await supabase.from('votes').update({ value }).eq('id', existing.id);
        }
      } else {
        // New vote
        const { error } = await supabase.from('votes').insert({
          post_id: postId,
          user_id: user.id,
          value,
        });
        if (error) throw error;
      }
      return { topicId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts', data.topicId] });
    },
  });
}
