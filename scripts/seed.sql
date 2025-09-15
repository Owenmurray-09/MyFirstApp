-- Seed data for jobs/internships app
-- Note: In production, profiles are created via Supabase Auth triggers
-- These INSERT statements assume you have test user UUIDs

-- Sample profiles (replace UUIDs with actual auth.users IDs in your environment)
INSERT INTO public.profiles (id, role, name, bio, interests, location, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'employer', 'Sarah Johnson', 'HR Manager at TechCorp with 5 years experience', '{}', 'San Francisco, CA', null),
  ('22222222-2222-2222-2222-222222222222', 'employer', 'Mike Chen', 'Restaurant owner passionate about giving students work experience', '{}', 'Los Angeles, CA', null),
  ('33333333-3333-3333-3333-333333333333', 'student', 'Alex Rivera', 'Computer Science major looking for internships', '{"programming", "web development", "data analysis"}', 'Berkeley, CA', null),
  ('44444444-4444-4444-4444-444444444444', 'student', 'Emma Thompson', 'Business student interested in retail and customer service', '{"customer service", "retail", "marketing"}', 'San Francisco, CA', null),
  ('55555555-5555-5555-5555-555555555555', 'student', 'Jordan Lee', 'Pre-med student seeking healthcare experience', '{"healthcare", "research", "patient care"}', 'Palo Alto, CA', null)
ON CONFLICT (id) DO NOTHING;

-- Sample companies
INSERT INTO public.companies (id, owner_user_id, name, description, location) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'TechCorp Solutions', 'Leading software development company specializing in mobile apps', 'San Francisco, CA'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Mikes Bistro', 'Family-owned restaurant serving authentic Italian cuisine', 'Los Angeles, CA')
ON CONFLICT (id) DO NOTHING;

-- Sample jobs
INSERT INTO public.jobs (id, company_id, title, description, tags, is_paid, stipend_amount, location, status) VALUES
  ('job11111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Software Engineering Intern', 
   'Join our development team to work on React Native mobile applications. Perfect for CS students wanting real-world experience.',
   '{"programming", "react native", "mobile development", "javascript"}', true, 2500.00, 'San Francisco, CA', 'open'),
   
  ('job22222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Data Analysis Intern',
   'Help our analytics team process user data and create insights dashboards using Python and SQL.',
   '{"data analysis", "python", "sql", "analytics"}', true, 2000.00, 'San Francisco, CA', 'open'),
   
  ('job33333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Server Assistant',
   'Learn restaurant operations while providing excellent customer service. Great for business students.',
   '{"customer service", "food service", "teamwork", "cash register"}', true, 18.00, 'Los Angeles, CA', 'open'),
   
  ('job44444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kitchen Prep Cook',
   'Work alongside experienced chefs to learn food preparation and kitchen operations.',
   '{"food preparation", "kitchen operations", "teamwork", "time management"}', true, 17.50, 'Los Angeles, CA', 'open')
ON CONFLICT (id) DO NOTHING;

-- Sample applications
INSERT INTO public.applications (id, job_id, student_user_id, note, status) VALUES
  ('app11111-1111-1111-1111-111111111111', 'job11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 
   'I am very interested in this position. I have experience with React and JavaScript from my coursework and personal projects.', 'submitted'),
   
  ('app22222-2222-2222-2222-222222222222', 'job22222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
   'I have strong analytical skills and experience with Python from my data structures course.', 'submitted'),
   
  ('app33333-3333-3333-3333-333333333333', 'job33333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
   'I have retail experience and love working with people. I am available evenings and weekends.', 'accepted')
ON CONFLICT (job_id, student_user_id) DO NOTHING;

-- Sample student preferences
INSERT INTO public.student_preferences (student_user_id, interest_tags) VALUES
  ('33333333-3333-3333-3333-333333333333', '{"programming", "web development", "data analysis", "react native", "javascript"}'),
  ('44444444-4444-4444-4444-444444444444', '{"customer service", "retail", "marketing", "food service", "cash register"}'),
  ('55555555-5555-5555-5555-555555555555', '{"healthcare", "research", "patient care", "laboratory work", "medical"}')
ON CONFLICT (student_user_id) DO NOTHING;

-- Sample thread and messages
INSERT INTO public.threads (id, job_id, employer_user_id, student_user_id, last_message_at) VALUES
  ('thread111-1111-1111-1111-111111111111', 'job33333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', now())
ON CONFLICT (job_id, employer_user_id, student_user_id) DO NOTHING;

INSERT INTO public.messages (id, thread_id, sender_user_id, body) VALUES
  ('msg11111-1111-1111-1111-111111111111', 'thread111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 
   'Hi Emma! I reviewed your application and I am impressed with your experience. When would be a good time for a brief interview?'),
   
  ('msg22222-2222-2222-2222-222222222222', 'thread111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444',
   'Thank you so much! I am available any weekday after 3 PM or weekends. Looking forward to meeting you!')
ON CONFLICT (id) DO NOTHING;

-- Sample comments
INSERT INTO public.comments (id, job_id, author_user_id, body) VALUES
  ('comment11-1111-1111-1111-111111111111', 'job33333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
   'Great place to work! Mike is very understanding of student schedules and the team is super welcoming. Learned a lot about customer service.')
ON CONFLICT (id) DO NOTHING;

-- Sample events
INSERT INTO public.events (id, job_id, organizer_user_id, participant_user_id, title, notes, start_at, end_at) VALUES
  ('event1111-1111-1111-1111-111111111111', 'job33333-3333-3333-3333-333333333333', 
   '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'Interview - Server Assistant Position', 'Brief 30-minute interview to discuss role and schedule',
   now() + interval '2 days', now() + interval '2 days' + interval '30 minutes'),
   
  ('event2222-2222-2222-2222-222222222222', 'job33333-3333-3333-3333-333333333333',
   '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'First Training Shift', 'Orientation and training on restaurant procedures',
   now() + interval '1 week', now() + interval '1 week' + interval '4 hours')
ON CONFLICT (id) DO NOTHING;

-- Sample recommendation
INSERT INTO public.recommendations (id, employer_id, student_id, job_id, content) VALUES
  ('rec11111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'job33333-3333-3333-3333-333333333333',
   'Emma was an exceptional employee during her time at Mikes Bistro. She demonstrated excellent customer service skills, was always punctual, and showed great initiative in learning new tasks. I would highly recommend her for any customer-facing role.')
ON CONFLICT (id) DO NOTHING;