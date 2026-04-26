DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- Public read of individual avatar files only when path is owner-scoped
-- (public bucket means direct URLs still load; this restricts listing)
CREATE POLICY "Owners can read their avatar files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);