import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, description, category, proposal }: {
      title: string;
      description: string;
      category: string;
      proposal?: string;
    }) => {
      if (!user) throw new Error('Must be signed in');
      const { data, error } = await supabase
        .from('topics')
        .insert({
          title,
          description,
          category,
          proposal: proposal || null,
          author_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}
