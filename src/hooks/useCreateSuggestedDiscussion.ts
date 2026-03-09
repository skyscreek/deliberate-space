import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CreateSuggestedDiscussionArgs {
  title: string;
  description: string;
  category: string;
  bridgeNodes: string[];
}

export function useCreateSuggestedDiscussion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, description, category, bridgeNodes }: CreateSuggestedDiscussionArgs) => {
      if (!user) throw new Error('Must be signed in to create a discussion');

      // 1. Create topic
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert({
          title,
          description,
          category,
          author_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (topicError) throw topicError;

      // 2. Create initial post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          topic_id: topic.id,
          content: description,
          author_id: user.id,
        });

      if (postError) throw postError;

      // 3. Create relations
      if (bridgeNodes && bridgeNodes.length > 0) {
        const relations = bridgeNodes.map(nodeId => ({
          source_topic_id: nodeId,
          target_topic_id: topic.id,
          relation_type: 'related',
          created_by: user.id,
        }));

        const { error: relationError } = await supabase
          .from('topic_relations')
          .insert(relations);

        if (relationError) throw relationError;
      }

      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topicRelations'] });
    },
  });
}
