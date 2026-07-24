-- Create OAuth Clients table
CREATE TABLE IF NOT EXISTS public.oauth_clients (
    client_id TEXT PRIMARY KEY,
    client_secret TEXT NOT NULL,
    redirect_uris TEXT[] NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OAuth Codes table (short-lived authorization codes)
CREATE TABLE IF NOT EXISTS public.oauth_codes (
    code TEXT PRIMARY KEY,
    client_id TEXT REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OAuth Tokens table (long-lived access and refresh tokens)
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
    access_token TEXT PRIMARY KEY,
    refresh_token TEXT UNIQUE,
    client_id TEXT REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Claude Web Client
INSERT INTO public.oauth_clients (client_id, client_secret, redirect_uris, name)
VALUES (
    'claude-web', 
    'bodhic_secret_claude_2026', -- Fixed static secret for simplicity for this client
    ARRAY['https://claude.ai/mcp/oauth/callback', 'https://chat.openai.com/aip/g-bodhic/oauth/callback'],
    'Claude & ChatGPT AI Integrations'
) ON CONFLICT (client_id) DO NOTHING;

-- Enable RLS (Row Level Security) but allow backend to bypass it via service role
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
