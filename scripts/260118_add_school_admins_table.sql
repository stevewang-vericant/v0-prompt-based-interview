-- File: 260118_add_school_admins_table.sql
-- Purpose: Add school_admins table to support multiple admin accounts per school
-- Affected Tables: schools, school_admins (new)
-- Dependencies: None
-- Date: 2026-01-18
--
-- This script creates the school_admins table and migrates existing School accounts
-- to SchoolAdmin records. It also makes School.email and password_hash nullable
-- for backward compatibility.

-- Step 1: Create school_admins table
CREATE TABLE IF NOT EXISTS public.school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT false,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, email)
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS school_admins_school_id_idx ON public.school_admins(school_id);
CREATE INDEX IF NOT EXISTS school_admins_email_idx ON public.school_admins(email);
CREATE INDEX IF NOT EXISTS school_admins_active_idx ON public.school_admins(active);
CREATE INDEX IF NOT EXISTS school_admins_is_super_admin_idx ON public.school_admins(is_super_admin);

-- Step 3: Migrate existing School accounts to SchoolAdmin (OPTIONAL)
-- NOTE: This step is commented out to preserve existing accounts in School table
-- Uncomment this section if you want to migrate existing accounts to SchoolAdmin table
-- For each school that has email and password_hash, create a corresponding SchoolAdmin record
-- INSERT INTO public.school_admins (school_id, email, password_hash, name, active, is_super_admin, created_at, updated_at)
-- SELECT 
--   id as school_id,
--   email,
--   password_hash,
--   contact_person as name,
--   active,
--   is_super_admin,
--   created_at,
--   updated_at
-- FROM public.schools
-- WHERE email IS NOT NULL 
--   AND email != ''
--   AND password_hash IS NOT NULL
--   AND password_hash != ''
-- ON CONFLICT (school_id, email) DO NOTHING;

-- Step 4: Make School.email and password_hash nullable (for backward compatibility)
-- Note: We keep them for now but they should not be used for new registrations
ALTER TABLE public.schools 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password_hash DROP NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON TABLE public.school_admins IS 'School administrators table - supports multiple admins per school';
COMMENT ON COLUMN public.school_admins.email IS 'Admin email address (used for login)';
COMMENT ON COLUMN public.school_admins.password_hash IS 'Hashed password for authentication';
COMMENT ON COLUMN public.school_admins.active IS 'Whether the admin account is active (requires approval for new registrations)';
COMMENT ON COLUMN public.school_admins.is_super_admin IS 'Whether this admin has super admin privileges';

-- Step 6: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_school_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER school_admins_updated_at
  BEFORE UPDATE ON public.school_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_school_admins_updated_at();
