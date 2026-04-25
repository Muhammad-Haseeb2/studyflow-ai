-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. user_roles table (roles MUST be separate from profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. user_roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin read access on every domain table
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all study_sessions"
  ON public.study_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all goals"
  ON public.goals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all notes"
  ON public.notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all quiz_results"
  ON public.quiz_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all calendar_events"
  ON public.calendar_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all flashcards"
  ON public.flashcards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all ai_interactions"
  ON public.ai_interactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Helper view exposing auth.users info to admins only
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles public.app_role[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    p.display_name,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY u.id, u.email, p.display_name, u.created_at, u.last_sign_in_at
  ORDER BY u.created_at DESC;
$$;

-- 7. Indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);