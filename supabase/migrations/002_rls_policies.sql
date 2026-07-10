-- RLS Policies for Agensi Competitor

-- 1. Admins Table
-- Allow admins to read their own record (so the frontend can check if they are an admin)
CREATE POLICY "Admins can view their own record" 
ON public.admins FOR SELECT 
USING (auth.uid() = id);

-- 2. Users Table
-- Allow users to read their own record
CREATE POLICY "Users can view their own record" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- 3. Skills Table
-- Allow anyone to read approved skills
CREATE POLICY "Anyone can view approved skills" 
ON public.skills FOR SELECT 
USING (moderation_status = 'approved');

-- Allow sellers to read all of their own skills (including pending/rejected)
CREATE POLICY "Sellers can view their own skills" 
ON public.skills FOR SELECT 
USING (auth.uid() = seller_id);

-- 4. Purchases Table
-- Allow buyers to view their own purchases
CREATE POLICY "Buyers can view their own purchases" 
ON public.purchases FOR SELECT 
USING (auth.uid() = buyer_id);
