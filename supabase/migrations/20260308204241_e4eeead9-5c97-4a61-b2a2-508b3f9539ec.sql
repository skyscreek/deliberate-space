
-- Add unique constraint for upsert on ai_analyses
CREATE UNIQUE INDEX IF NOT EXISTS ai_analyses_topic_analysis_unique ON public.ai_analyses (topic_id, analysis_type);
