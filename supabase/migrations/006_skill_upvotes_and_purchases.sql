CREATE TABLE IF NOT EXISTS public.skill_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, user_id)
);

ALTER TABLE public.skill_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view upvotes" ON public.skill_upvotes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert upvotes" ON public.skill_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upvotes" ON public.skill_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Add purchase count
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;

-- Atomic increment functions
CREATE OR REPLACE FUNCTION increment_upvotes(skill_uuid UUID)
RETURNS void AS $$
  UPDATE public.skills SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = skill_uuid;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION decrement_upvotes(skill_uuid UUID)
RETURNS void AS $$
  UPDATE public.skills SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = skill_uuid;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION increment_purchase_count(skill_uuid UUID)
RETURNS void AS $$
  UPDATE public.skills SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = skill_uuid;
$$ LANGUAGE sql;
