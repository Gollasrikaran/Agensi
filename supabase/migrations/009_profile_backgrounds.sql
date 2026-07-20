-- 1. Add background_url to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS background_url TEXT;

-- 2. Create user_media storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_media', 'user_media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow authenticated users to upload files to user_media
-- (The owner is automatically set to auth.uid() by Supabase on upload)
CREATE POLICY "Users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user_media' AND owner = auth.uid());

-- 4. Allow authenticated users to update their own files
CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user_media' AND owner = auth.uid());

-- 5. Allow public read access to the bucket
CREATE POLICY "Public read access to user_media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user_media');
