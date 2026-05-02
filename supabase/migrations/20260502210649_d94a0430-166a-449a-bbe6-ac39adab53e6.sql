-- Add storage UPDATE policy for assignment-files (owner-only)
CREATE POLICY "Users update own assignment files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'assignment-files' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'assignment-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Harden user_roles: add RESTRICTIVE policy that blocks non-admin self-insert
-- (Permissive admin-only INSERT already exists; RESTRICTIVE adds AND-gated guarantee.)
CREATE POLICY "Block non-admin role self-insert"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lock down SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated,
-- granting only to authenticated where required for app behavior.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- handle_new_user is a trigger; revoke from clients entirely
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;