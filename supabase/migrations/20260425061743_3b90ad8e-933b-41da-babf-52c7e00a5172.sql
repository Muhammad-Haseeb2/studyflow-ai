-- Assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled assignment',
  topic text,
  level text NOT NULL DEFAULT 'medium',
  language text NOT NULL DEFAULT 'English',
  formatting_style text NOT NULL DEFAULT 'academic',
  word_count integer NOT NULL DEFAULT 800,
  include_title_page boolean NOT NULL DEFAULT true,
  include_references boolean NOT NULL DEFAULT false,
  source_input text,
  source_filename text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  references_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  docx_path text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_created_at ON public.assignments(created_at DESC);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by owner" ON public.assignments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all assignments" ON public.assignments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own assignments" ON public.assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assignments" ON public.assignments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own assignments" ON public.assignments
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for generated/uploaded assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

CREATE POLICY "Users view own assignment files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users upload own assignment files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own assignment files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Admins view all assignment files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignment-files'
    AND public.has_role(auth.uid(), 'admin')
  );