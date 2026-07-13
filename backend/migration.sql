-- Run this in your Supabase SQL Editor to apply schema changes for the new features

-- 1. Add upvotes and billing_type to skills
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'one-time';

-- 2. Create skill_requests (Bounties) table
CREATE TABLE IF NOT EXISTS skill_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    bounty_inr NUMERIC NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'claimed', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for skill_requests
ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read access to requests
CREATE POLICY "Public profiles are viewable by everyone." 
ON skill_requests FOR SELECT USING (true);

-- Allow authenticated users to insert requests
CREATE POLICY "Users can insert their own requests." 
ON skill_requests FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Allow users to update their own requests
CREATE POLICY "Users can update own requests." 
ON skill_requests FOR UPDATE USING (auth.uid() = buyer_id);
