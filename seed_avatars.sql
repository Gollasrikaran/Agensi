-- Seed script for avatar packs
INSERT INTO public.avatar_packs (id, name, description, category, unlock_condition_type, unlock_condition_value, price_credits)
VALUES 
  ('pack_cyber', 'Cyberpunk', 'Neon-lit cybernetic avatars for the futuristic developer.', 'premium', 'purchase', '0', 500),
  ('pack_nature', 'Druid', 'Earthy, nature-themed avatars.', 'premium', 'purchase', '0', 300),
  ('pack_hacker', 'Elite Hacker', 'Terminal green and black avatars.', 'achievement', 'first_sale', '1', 0),
  ('pack_elite', 'Bodhic Elite', 'Exclusive avatars for top creators.', 'tier', 'Elite', '0', 0),
  ('pack_gold', 'Gold Standard', 'Shiny, golden avatars for high rollers.', 'purchase', '0', '0', 1000)
ON CONFLICT (id) DO NOTHING;

-- Seed script for avatar items
INSERT INTO public.avatar_items (id, pack_id, name, image_url, rarity)
VALUES
  ('item_cyber_1', 'pack_cyber', 'Neon Goggles', 'https://api.dicebear.com/9.x/bottts/svg?seed=NeonGoggles&backgroundColor=transparent', 'rare'),
  ('item_cyber_2', 'pack_cyber', 'Cyber Skull', 'https://api.dicebear.com/9.x/bottts/svg?seed=CyberSkull&backgroundColor=transparent', 'epic'),
  ('item_cyber_3', 'pack_cyber', 'Tech Visor', 'https://api.dicebear.com/9.x/bottts/svg?seed=TechVisor&backgroundColor=transparent', 'common'),
  
  ('item_nature_1', 'pack_nature', 'Leafy Crown', 'https://api.dicebear.com/9.x/bottts/svg?seed=LeafyCrown&backgroundColor=transparent', 'common'),
  ('item_nature_2', 'pack_nature', 'Wood Golem', 'https://api.dicebear.com/9.x/bottts/svg?seed=WoodGolem&backgroundColor=transparent', 'rare'),
  
  ('item_hacker_1', 'pack_hacker', 'Matrix Mask', 'https://api.dicebear.com/9.x/bottts/svg?seed=MatrixMask&backgroundColor=transparent', 'epic'),
  
  ('item_elite_1', 'pack_elite', 'Diamond Crown', 'https://api.dicebear.com/9.x/bottts/svg?seed=DiamondCrown&backgroundColor=transparent', 'legendary'),
  
  ('item_gold_1', 'pack_gold', 'Golden Bot', 'https://api.dicebear.com/9.x/bottts/svg?seed=GoldenBot&backgroundColor=transparent', 'epic')
ON CONFLICT (id) DO NOTHING;
