-- Run this in your Supabase SQL Editor
-- Fixes the two root causes of the 500 errors on /api/skills/upload

-- 1. Rename base_price_usd → base_price_inr on the skills table
--    (the backend inserts base_price_inr but the column is still named base_price_usd)
ALTER TABLE public.skills
  RENAME COLUMN base_price_usd TO base_price_inr;

-- 2. Create the skill_versions table (referenced in main.py but never created)
CREATE TABLE IF NOT EXISTS public.skill_versions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id       UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    md_content     TEXT NOT NULL,
    changelog      TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;

-- Sellers can read versions of their own skills
CREATE POLICY "Sellers can view their own skill versions"
ON public.skill_versions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.skills
        WHERE skills.id = skill_versions.skill_id
          AND skills.seller_id = auth.uid()
    )
);
