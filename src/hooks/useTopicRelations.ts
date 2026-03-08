import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopicRelation {
  id: string;
  source_topic_id: string;
  target_topic_id: string;
  relation_type: string;
}

export function useTopicRelations() {
  return useQuery({
    queryKey: ['topic-relations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_relations')
        .select('id, source_topic_id, target_topic_id, relation_type');
      if (error) throw error;
      return (data ?? []) as TopicRelation[];
    },
  });
}
