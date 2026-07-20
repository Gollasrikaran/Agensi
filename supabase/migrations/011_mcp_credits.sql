-- 1. CREDITS & MCP AUTHENTICATION
CREATE TABLE public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    api_key_hash TEXT NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(50) DEFAULT 'Default Key',
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_credits (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('top_up', 'mcp_purchase', 'refund', 'bonus')),
    reference_id TEXT, -- Can link to Razorpay txn or skill_id
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENT COMPATIBILITY TAGS
CREATE TABLE public.agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.skill_agent_compatibility (
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES public.agents(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, agent_id)
);

-- RLS POLICIES
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage their own API keys" 
    ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credit balance" 
    ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update on credits must be done via secure backend (Service Role)

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" 
    ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Agents are public read-only
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents are viewable by everyone" 
    ON public.agents FOR SELECT USING (true);

ALTER TABLE public.skill_agent_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent compatibility is viewable by everyone" 
    ON public.skill_agent_compatibility FOR SELECT USING (true);
