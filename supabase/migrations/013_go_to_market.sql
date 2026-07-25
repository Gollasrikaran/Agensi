-- 013_go_to_market.sql
-- Add Target Audience and Complexity Level to Skills
DO $$ BEGIN
    CREATE TYPE audience_type AS ENUM ('student', 'professional', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS target_audience audience_type DEFAULT 'all';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS complexity_level INTEGER DEFAULT 1;

-- Ensure all existing skills have safe defaults
UPDATE public.skills SET target_audience = 'all' WHERE target_audience IS NULL;
UPDATE public.skills SET complexity_level = 1 WHERE complexity_level IS NULL;

-- Create Referrals Table for the Viral WhatsApp Loop
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    referred_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_earned_credits DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for referrals (users can read their own referrals)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
