-- 018_agent_tools_storage.sql

-- Create a new storage bucket for ZIP archives
INSERT INTO storage.buckets (id, name, public) VALUES ('skill_archives', 'skill_archives', true);

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload skill archives"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'skill_archives' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Anyone can read (public download)
CREATE POLICY "Public read access for skill archives"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'skill_archives');
