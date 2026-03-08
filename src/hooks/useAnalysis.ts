import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIAnalysis {
  summary: string;
  tensions: {
    id: string;
    label: string;
    sideA: string;
    sideB: string;
    relatedPostIds: string[];
  }[];
  clusters: {
    id: string;
    name: string;
    description: string;
    postCount: number;
    relatedPostIds: string[];
  }[];
  open_questions: {
    id: string;
    question: string;
    raisedInPostId: string;
    raisedBy?: string;
    relatedPostIds: string[];
  }[];
  guidance: {
    id: string;
    type: string;
    label: string;
    description: string;
    targetPostId?: string;
    suggestedArgdownType?: string;
  }[];
  classifications: {
    postId: string;
    suggestedType: string;
    confidence: number;
  }[];
}

/** Fetch cached analysis from DB */
export function useAnalysis(topicId: string | undefined) {
  return useQuery({
    queryKey: ['analysis', topicId],
    enabled: !!topicId,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('content, created_at')
        .eq('topic_id', topicId!)
        .eq('analysis_type', 'full')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        analysis: data.content as unknown as AIAnalysis,
        createdAt: data.created_at,
      };
    },
  });
}

/** Trigger a new AI analysis */
export function useRunAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (topicId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-discussion', {
        body: { topic_id: topicId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AIAnalysis;
    },
    onSuccess: (_, topicId) => {
      queryClient.invalidateQueries({ queryKey: ['analysis', topicId] });
    },
  });
}
