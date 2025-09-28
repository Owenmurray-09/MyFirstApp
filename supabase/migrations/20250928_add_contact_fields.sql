-- Add contact fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Add contact fields to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;