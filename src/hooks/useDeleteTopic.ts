import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ topicId }: { topicId: string }) => {
      if (!user) throw new Error('Must be signed in');

      const { data, error } = await supabase
        .from('topics')
        .update({ status: 'deleted' })
        .eq('id', topicId)
        .eq('author_id', user.id)
        .select('id, slug')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic'] });
      queryClient.invalidateQueries({ queryKey: ['posts', vars.topicId] });
    },
  });
}
