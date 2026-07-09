-- Create custom types
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'rejected');

-- 1. Users Table (can both buy and sell)
-- Linked to the built-in Supabase auth.users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    country_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Admins Table
-- Linked to the built-in Supabase auth.users table but stored separately for strict access control
CREATE TABLE public.admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Function to automatically create a regular user profile after Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- By default, all signups via the portal become standard users (capable of buying and selling)
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Skills Table
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    base_price_usd DECIMAL(10, 2) NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    skill_md_file_url TEXT,
    moderation_status moderation_status DEFAULT 'pending',
    scan_summary_json JSONB,
    declared_capabilities_json JSONB,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- 4. Exchange Rates Table
CREATE TABLE public.exchange_rates (
    currency_code TEXT PRIMARY KEY,
    rate_to_usd DECIMAL(10, 4) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 5. Purchases Table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    payment_provider TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    provider_txn_id TEXT,
    is_team_license BOOLEAN DEFAULT FALSE,
    seat_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 6. Reviews Table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, buyer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Payouts Table
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 8. Security Scans Table
CREATE TABLE public.security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    tier INTEGER CHECK (tier IN (1, 2)) NOT NULL,
    scan_result_json JSONB,
    rule_categories_triggered TEXT[],
    passed BOOLEAN NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;

-- 9. Disputes Table
CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status dispute_status DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
