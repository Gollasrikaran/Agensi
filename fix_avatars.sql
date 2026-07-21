-- Delete any partial inserts to start fresh (since we're generating fixed UUIDs)
DELETE FROM public.avatar_packs WHERE id IN (
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000004',
  'f0000000-0000-0000-0000-000000000005'
);

-- Seed script for avatar packs using the exact schema
INSERT INTO public.avatar_packs (id, name, slug, description, icon_emoji, price_inr, tier, is_active, category, unlock_condition_type)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'Cyberpunk', 'cyberpunk', 'Neon-lit cybernetic avatars for the futuristic developer.', '🤖', 500, 'standard', true, 'premium', 'purchase'),
  ('f0000000-0000-0000-0000-000000000002', 'Druid', 'druid', 'Earthy, nature-themed avatars.', '🌿', 300, 'standard', true, 'premium', 'purchase'),
  ('f0000000-0000-0000-0000-000000000003', 'Elite Hacker', 'elite_hacker', 'Terminal green and black avatars.', '💻', 0, 'exclusive', true, 'achievement', 'first_sale'),
  ('f0000000-0000-0000-0000-000000000004', 'Bodhic Elite', 'bodhic_elite', 'Exclusive avatars for top creators.', '👑', 0, 'exclusive', true, 'tier', 'Elite'),
  ('f0000000-0000-0000-0000-000000000005', 'Gold Standard', 'gold_standard', 'Shiny, golden avatars for high rollers.', '✨', 1000, 'exclusive', true, 'premium', 'purchase');

-- Seed script for avatar items using the exact schema
INSERT INTO public.avatar_items (id, pack_id, label, image_url, sort_order)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Neon Goggles', 'https://api.dicebear.com/9.x/bottts/svg?seed=NeonGoggles&backgroundColor=transparent', 1),
  ('e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Cyber Skull', 'https://api.dicebear.com/9.x/bottts/svg?seed=CyberSkull&backgroundColor=transparent', 2),
  ('e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Tech Visor', 'https://api.dicebear.com/9.x/bottts/svg?seed=TechVisor&backgroundColor=transparent', 3),
  
  ('e0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'Leafy Crown', 'https://api.dicebear.com/9.x/bottts/svg?seed=LeafyCrown&backgroundColor=transparent', 1),
  ('e0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'Wood Golem', 'https://api.dicebear.com/9.x/bottts/svg?seed=WoodGolem&backgroundColor=transparent', 2),
  
  ('e0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000003', 'Matrix Mask', 'https://api.dicebear.com/9.x/bottts/svg?seed=MatrixMask&backgroundColor=transparent', 1),
  
  ('e0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000004', 'Diamond Crown', 'https://api.dicebear.com/9.x/bottts/svg?seed=DiamondCrown&backgroundColor=transparent', 1),
  
  ('e0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000005', 'Golden Bot', 'https://api.dicebear.com/9.x/bottts/svg?seed=GoldenBot&backgroundColor=transparent', 1);
