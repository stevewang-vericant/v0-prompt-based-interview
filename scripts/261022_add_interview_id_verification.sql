-- File: 261022_add_interview_id_verification.sql
-- Purpose: Store the registration ID photo and the in-interview screenshot used for identity review
-- Affected Tables: interviews
-- Dependencies: interviews.verification_status already exists (pending | approved | rejected)
-- Date: 2026-10-22
--
-- Students upload a photo of themselves holding their ID during VGI registration.
-- The app captures one camera frame during the interview. Internal staff compare
-- the two images and approve or reject the interview.
--
-- Rollback:
--   DROP INDEX IF EXISTS interviews_verification_status_idx;
--   ALTER TABLE interviews
--     DROP COLUMN IF EXISTS id_photo_url,
--     DROP COLUMN IF EXISTS verification_screenshot_url,
--     DROP COLUMN IF EXISTS verification_reviewed_at,
--     DROP COLUMN IF EXISTS verification_reviewed_by,
--     DROP COLUMN IF EXISTS verification_note;

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS id_photo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS verification_screenshot_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_note VARCHAR(500);

CREATE INDEX IF NOT EXISTS interviews_verification_status_idx
  ON interviews (verification_status);
