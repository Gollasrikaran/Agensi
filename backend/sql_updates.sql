-- Run this in your Supabase SQL Editor to support the new features:

CREATE TABLE IF NOT EXISTS public.skill_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

ALTER TABLE public.skill_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own upvotes" ON public.skill_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own upvotes" ON public.skill_upvotes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view upvotes" ON public.skill_upvotes FOR SELECT USING (true);

-- Reset upvotes (but keep star ratings and downloads accurate)
UPDATE public.skills SET upvotes = 0;

-- New DMCA requests table
CREATE TABLE IF NOT EXISTS public.dmca_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    infringing_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewing, resolved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dmca_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can insert their own dmca requests" ON public.dmca_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can view their own dmca requests" ON public.dmca_requests FOR SELECT USING (auth.uid() = seller_id);
