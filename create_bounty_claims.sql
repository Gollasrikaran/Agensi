CREATE TABLE public.bounty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES public.skill_requests(id) ON DELETE CASCADE,
    claimer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    submitted_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bounty_id, claimer_id) -- A user can only submit one claim per bounty
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read bounty claims (or restrict to buyer/claimer if needed)
CREATE POLICY "Public profiles can read bounty claims" ON public.bounty_claims
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own claims
CREATE POLICY "Users can insert their own claims" ON public.bounty_claims
    FOR INSERT WITH CHECK (auth.uid() = claimer_id);
