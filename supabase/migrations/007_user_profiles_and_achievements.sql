-- 007_user_profiles_and_achievements.sql

-- 1. Pinned Skills
CREATE TABLE IF NOT EXISTS pinned_skills (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    pin_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, skill_id)
);

-- 2. Achievements Dictionary
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'first_sale', 'verified_creator'
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_admin_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-seed some default achievements
INSERT INTO achievements (id, title, description, icon_url, is_admin_awarded) VALUES
('first_sale', 'First Sale', 'Completed your first sale on Bodhic AI.', '🎉', false),
('10_downloads', 'Rising Star', 'Reached 10 total downloads across all your skills.', '🚀', false),
('100_downloads', 'Marketplace Favorite', 'Reached 100 total downloads across all your skills.', '💎', false),
('1k_earned', 'First ₹1K', 'Earned your first ₹1,000 on the platform.', '💰', false),
('10k_earned', '₹10K Club', 'Earned ₹10,000 on the platform.', '🏦', false),
('community_favorite', 'Community Favorite', 'Received 50+ total upvotes across your skills.', '❤️', false),
('top_10_leaderboard', 'Top 10 Leaderboard', 'Reached the top 10 on the monthly leaderboard.', '🏆', false),
('streak_7', 'Streak Novice', 'Maintained activity for 7 consecutive days.', '🔥', false),
('streak_30', 'Streak Warrior', 'Maintained activity for 30 consecutive days.', '⚡', false),
('verified_creator', 'Verified Creator', 'Platform trusted creator with multiple approved skills.', '🛡️', true)
ON CONFLICT (id) DO NOTHING;

-- 3. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) REFERENCES achievements(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 4. User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    frozen_days_available INT DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Activity Log
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'upload', 'sale', 'upvote'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE pinned_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Pinned skills are public
CREATE POLICY "Pinned skills are viewable by everyone" ON pinned_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their pinned skills" ON pinned_skills FOR ALL USING (auth.uid() = user_id);

-- Achievements dictionary is public
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- User achievements: owners can view all, others can only view public ones
CREATE POLICY "Users can view public achievements" ON user_achievements FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
-- Insert is usually done by backend bypass RLS, but allow it anyway if needed
CREATE POLICY "Users can insert achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks are public
CREATE POLICY "Streaks are viewable by everyone" ON user_streaks FOR SELECT USING (true);
CREATE POLICY "Users can update their streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Activity is public for the streak graph
CREATE POLICY "Activity is viewable by everyone" ON user_activity FOR SELECT USING (true);
CREATE POLICY "Users can insert activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
