-- Run this in your Supabase SQL Editor
-- Add item_type and media_url to skills table to support Prompts and media previews

ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'skill',
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Ensure all existing rows have the correct default
UPDATE public.skills SET item_type = 'skill' WHERE item_type IS NULL;
