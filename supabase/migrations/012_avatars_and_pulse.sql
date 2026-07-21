-- ==============================================================================
-- Bodhic AI: Avatar System + Skill Pulse Schema
-- ==============================================================================

-- 1. AVATAR PACKS
CREATE TABLE IF NOT EXISTS avatar_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_emoji VARCHAR(10),
    price_inr INTEGER NOT NULL DEFAULT 0, -- 0 = free pack
    tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('free', 'standard', 'premium', 'exclusive')),
    is_active BOOLEAN DEFAULT TRUE,
    preview_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AVATAR ITEMS
CREATE TABLE IF NOT EXISTS avatar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID REFERENCES avatar_packs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    label VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER AVATAR UNLOCKS
CREATE TABLE IF NOT EXISTS user_avatar_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES avatar_packs(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_id UUID,
    UNIQUE (user_id, pack_id)
);

-- 4. USER PULSE SCORES
CREATE TABLE IF NOT EXISTS user_pulse_scores (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    pulse_score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, month_year)
);

-- Ensure activity types cover pulse requirements
-- (Assuming user_activity table exists and uses VARCHAR for activity_type)

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

ALTER TABLE avatar_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active avatar packs" ON avatar_packs FOR SELECT USING (is_active = TRUE);

ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view avatar items" ON avatar_items FOR SELECT USING (TRUE);

ALTER TABLE user_avatar_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own unlocks" ON user_avatar_unlocks FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_pulse_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user pulse scores" ON user_pulse_scores FOR SELECT USING (TRUE);
