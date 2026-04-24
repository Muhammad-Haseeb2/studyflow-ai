-- =====================================================
-- PROFILES (auto-created on signup)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STUDY SESSIONS
-- =====================================================
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_sec INTEGER NOT NULL CHECK (duration_sec >= 0),
  mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('pomodoro','normal')),
  label TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_study_sessions_user_started ON public.study_sessions(user_id, started_at DESC);

CREATE POLICY "Sessions viewable by owner" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- GOALS
-- =====================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_minutes_per_day INTEGER NOT NULL DEFAULT 30 CHECK (target_minutes_per_day > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','completed')),
  progress NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_goals_user_created ON public.goals(user_id, created_at DESC);

CREATE POLICY "Goals viewable by owner" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- NOTES
-- =====================================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notes_user_updated ON public.notes(user_id, updated_at DESC);

CREATE POLICY "Notes viewable by owner" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- QUIZ RESULTS
-- =====================================================
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  total INTEGER NOT NULL CHECK (total >= 0),
  correct INTEGER NOT NULL CHECK (correct >= 0),
  weak_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quiz_user_created ON public.quiz_results(user_id, created_at DESC);

CREATE POLICY "Quiz viewable by owner" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own quiz results" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own quiz results" ON public.quiz_results
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CALENDAR EVENTS
-- =====================================================
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'study' CHECK (category IN ('study','exam','revision','break','other')),
  reminder_minutes_before INTEGER,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_user_starts ON public.calendar_events(user_id, starts_at);

CREATE POLICY "Events viewable by owner" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FLASHCARDS
-- =====================================================
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_title TEXT NOT NULL DEFAULT 'Untitled deck',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_flashcards_user_created ON public.flashcards(user_id, created_at DESC);
CREATE INDEX idx_flashcards_user_deck ON public.flashcards(user_id, deck_title);

CREATE POLICY "Flashcards viewable by owner" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- AI INTERACTIONS
-- =====================================================
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('chat','quiz','flashcards','mindmap','notes','essay','translator','voice','other')),
  input_text TEXT NOT NULL,
  response_text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ai_user_created ON public.ai_interactions(user_id, created_at DESC);
CREATE INDEX idx_ai_user_feature ON public.ai_interactions(user_id, feature_type);

CREATE POLICY "AI history viewable by owner" ON public.ai_interactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own AI history" ON public.ai_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own AI history" ON public.ai_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();