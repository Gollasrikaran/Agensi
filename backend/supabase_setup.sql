-- Run this in your Supabase SQL Editor

-- 1. Create seller_wallets table
CREATE TABLE IF NOT EXISTS seller_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_inr NUMERIC DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for seller_wallets
ALTER TABLE seller_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wallet" ON seller_wallets FOR SELECT USING (auth.uid() = user_id);

-- 2. Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_inr NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    upi_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for payout_requests
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payout requests" ON payout_requests FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Users can insert their own payout requests" ON payout_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);
-- Admins can view and update all (assuming admin bypasses RLS using service role key in backend)

-- Rename skills column
ALTER TABLE skills RENAME COLUMN base_price_usd TO base_price_inr;
