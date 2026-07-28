-- Execute this in your Supabase SQL Editor to add the new columns for direct code submission and rejections
ALTER TABLE public.bounty_claims 
ADD COLUMN submitted_code TEXT,
ADD COLUMN rejection_reason TEXT;
