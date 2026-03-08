
-- Fix ai_analyses INSERT policy: only service role should insert (via edge functions)
-- Drop the overly permissive policy
DROP POLICY "Service role can insert analyses" ON public.ai_analyses;

-- No INSERT policy for authenticated users — edge functions use service role key which bypasses RLS
