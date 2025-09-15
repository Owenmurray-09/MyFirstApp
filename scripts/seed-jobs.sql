-- Seed data for Salon de Patines Music job listing
-- Run this in your Supabase SQL Editor

-- First, create a company for the job
INSERT INTO companies (
  id,
  name,
  description,
  location,
  owner_user_id,
  created_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Salón de Patines Music',
  'A lively roller-skating rink in Costa Rica offering fun activities and music for all ages',
  'La Fuente de la Hispanidad, San Pedro, San José, Costa Rica',
  (SELECT id FROM auth.users LIMIT 1), -- Use any existing user as owner for now
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create the job listing
INSERT INTO jobs (
  id,
  company_id,
  title,
  description,
  location,
  is_paid,
  stipend_amount,
  tags,
  images,
  status,
  created_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Salon de Patines Music',
  'At Salón de Patines Music, the lively roller-skating rink in Costa Rica, students can enjoy a vibrant environment filled with music, movement, and friendly faces. Working on the rink floor means being part of the energy—helping skaters have fun while the music plays and learning how to keep things safe and welcoming. If you prefer to work behind the scenes, the guardarropía and skate counter offer valuable opportunities to interact with customers one-on-one, whether it''s fitting skates, organizing backpacks, or answering questions. No matter the role, you''ll build real-world customer service skills while being immersed in a fun, upbeat atmosphere.',
  'La Fuente de la Hispanidad, San Pedro, San José, Costa Rica',
  false,
  NULL,
  ARRAY['cash register', 'customer support', 'hard physical work', 'first aid', 'customer interaction', 'teamwork', 'equipment handling', 'communication with coworkers', 'basic maintenance'],
  ARRAY['https://placeholder.com/400x300/FF6B6B/FFFFFF?text=SPM+Rink+1', 'https://placeholder.com/400x300/4ECDC4/FFFFFF?text=SPM+Rink+2', 'https://placeholder.com/400x300/45B7D1/FFFFFF?text=SPM+Counter'],
  'open',
  NOW()
) ON CONFLICT (id) DO NOTHING;