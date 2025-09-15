-- Add daily_digest_enabled field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_digest_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.daily_digest_enabled IS 'Student preference for daily digest notifications vs immediate notifications';

-- TODO: Phase 2 - Add push notification token field
-- ALTER TABLE public.profiles 
-- ADD COLUMN IF NOT EXISTS push_token text;
-- COMMENT ON COLUMN public.profiles.push_token IS 'Expo push notification token for mobile notifications';

-- TODO: Phase 2 - Create notification logs table for analytics
-- CREATE TABLE IF NOT EXISTS public.notification_logs (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
--   job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
--   notification_type text NOT NULL CHECK (notification_type IN ('job_match', 'daily_digest')),
--   sent_at timestamptz DEFAULT now(),
--   delivery_method text CHECK (delivery_method IN ('push', 'email')),
--   status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
--   created_at timestamptz DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS notification_logs_student_idx ON public.notification_logs(student_id);
-- CREATE INDEX IF NOT EXISTS notification_logs_job_idx ON public.notification_logs(job_id);