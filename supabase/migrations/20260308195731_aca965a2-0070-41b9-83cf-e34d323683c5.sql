
-- =============================================
-- STEP 1: Utility function for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TOPICS (discussion threads)
-- =============================================
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  proposal TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'seeking-consensus', 'resolved', 'archived')),
  canonical_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics" ON public.topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their topics" ON public.topics FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their topics" ON public.topics FOR DELETE USING (auth.uid() = author_id);

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_topics_category ON public.topics(category);
CREATE INDEX idx_topics_status ON public.topics(status);
CREATE INDEX idx_topics_canonical ON public.topics(canonical_topic_id);

-- =============================================
-- POSTS (top-level contributions in a topic)
-- =============================================
CREATE TYPE public.argdown_type AS ENUM (
  'claim', 'support', 'objection', 'concern', 'alternative',
  'question', 'proposal', 'evidence', 'rebuttal'
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  argdown_type public.argdown_type,
  parent_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_posts_topic ON public.posts(topic_id);
CREATE INDEX idx_posts_parent ON public.posts(parent_post_id);
CREATE INDEX idx_posts_author ON public.posts(author_id);

-- =============================================
-- VOTES
-- =============================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_votes_post ON public.votes(post_id);

-- Trigger to update post score when votes change
CREATE OR REPLACE FUNCTION public.update_post_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET score = (SELECT COALESCE(SUM(value), 0) FROM public.votes WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    RETURN OLD;
  ELSE
    UPDATE public.posts SET score = (SELECT COALESCE(SUM(value), 0) FROM public.votes WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_score();

-- =============================================
-- AI ANALYSES (generated by LLM)
-- =============================================
CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('summary', 'tensions', 'clusters', 'questions', 'guidance', 'argument_map')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analyses are viewable by everyone" ON public.ai_analyses FOR SELECT USING (true);
CREATE POLICY "Service role can insert analyses" ON public.ai_analyses FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_ai_analyses_topic ON public.ai_analyses(topic_id);
CREATE INDEX idx_ai_analyses_type ON public.ai_analyses(topic_id, analysis_type);

-- =============================================
-- TOPIC RELATIONS (for graph visualization)
-- =============================================
CREATE TABLE public.topic_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('related', 'merged', 'subtopic', 'contradicts')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_topic_id, target_topic_id, relation_type)
);

ALTER TABLE public.topic_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relations are viewable by everyone" ON public.topic_relations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create relations" ON public.topic_relations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE INDEX idx_topic_relations_source ON public.topic_relations(source_topic_id);
CREATE INDEX idx_topic_relations_target ON public.topic_relations(target_topic_id);
