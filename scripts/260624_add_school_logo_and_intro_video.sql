-- File: 260624_add_school_logo_and_intro_video.sql
-- Purpose: Add logo_url and intro_video_url to the schools table so schools can
--          upload a logo (shown on the student interview page) and an intro video
--          (played before the student starts the interview).
-- Affected Tables: schools
-- Dependencies: None
-- Date: 2026-06-24
--
-- Both columns are nullable; existing schools keep working with no branding.
-- Deployment normally applies this automatically via `npx prisma db push`.
-- This script is an idempotent manual fallback for direct DB access.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS intro_video_url VARCHAR(500);

-- Rollback (manual):
-- ALTER TABLE schools DROP COLUMN IF EXISTS logo_url;
-- ALTER TABLE schools DROP COLUMN IF EXISTS intro_video_url;
