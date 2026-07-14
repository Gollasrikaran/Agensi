-- Add User Profile Fields
ALTER TABLE public.users
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN avatar_url TEXT;

-- Update RLS for users to allow public read access for profiles
-- Currently, users can only read their own profile. We need buyers to see seller profiles!
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;

-- 1. Anyone can view basic user profiles (for the marketplace)
CREATE POLICY "Anyone can view user profiles" 
ON public.users FOR SELECT 
USING (true);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);
