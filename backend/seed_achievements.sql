CREATE TABLE IF NOT EXISTS public.achievements (
  id character varying(50) primary key,
  title text not null,
  description text not null,
  icon_url text not null,
  is_admin_awarded boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Seed basic milestones
INSERT INTO public.achievements (id, title, description, icon_url, is_admin_awarded) VALUES
('first_upload', 'First Upload', 'Published your first AI agent skill.', '🚀', false),
('first_sale', 'First Sale', 'Made your first skill sale.', '💰', false),
('community_favorite', 'Community Favorite', 'Received 10+ upvotes on a single skill.', '⭐', false),
('top_creator', 'Top Creator', 'Reached 50 total skill sales.', '🏆', false),
('on_fire', 'On Fire', 'Maintained a 7-day activity streak.', '🔥', false),
('bounty_hunter', 'Bounty Hunter', 'Claimed a requested skill bounty.', '🎯', false),
('prolific_publisher', 'Prolific Publisher', 'Published 10 or more skills.', '📦', false),
('diamond_seller', 'Diamond Seller', 'Reached 100 total skill sales.', '💎', false)
ON CONFLICT (id) DO NOTHING;
