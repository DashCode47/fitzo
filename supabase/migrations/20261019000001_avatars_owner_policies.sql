-- Avatars live at the bucket root as `${user.id}.${ext}` (hooks/useProfileImage.ts).
-- Writes are limited to the caller's own file; reads stay public.

DROP POLICY IF EXISTS "Usuarios logueados pueden subir avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden borrar su avatar" ON storage.objects;
-- Unused `private/` folder policies: let any user write arbitrary files to the bucket.
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;

CREATE POLICY "Avatar: subir el propio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND split_part(name, '.', 1) = auth.uid()::text);

CREATE POLICY "Avatar: actualizar el propio" ON storage.objects FOR UPDATE TO authenticated
  USING      (bucket_id = 'avatars' AND split_part(name, '.', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND split_part(name, '.', 1) = auth.uid()::text);

CREATE POLICY "Avatar: borrar el propio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name, '.', 1) = auth.uid()::text);
