-- File: 260426_add_prep_video_columns.sql
-- Purpose: Add columns to support recording preparation time alongside response time
--          and exposing a separate "with-prep" merged video link on the watch page.
-- Affected Tables: interviews, interview_responses
-- Dependencies: Run after Prisma schema sync (or via `prisma db push`)
-- Date: 2026-04-26
--
-- Behavior:
--   - interviews.video_with_prep_url:
--       Nullable URL to the merged MP4 that includes both preparation and response
--       segments per question. Populated only for interviews recorded with the new
--       continuous recording flow. Existing rows stay NULL → school UI hides the
--       extra link entirely. The existing `video_url` column continues to point at
--       the response-only merged MP4 used in the dashboard list.
--
--   - interview_responses.prep_duration:
--       Per-question preparation duration (seconds) captured at upload time.
--       Used by the merge worker to know how many seconds to trim from the head of
--       each segment when producing the response-only video. NULL for legacy rows.
--
-- Idempotent: uses IF NOT EXISTS so re-runs are safe.
--
-- Rollback:
--   ALTER TABLE interviews         DROP COLUMN IF EXISTS video_with_prep_url;
--   ALTER TABLE interview_responses DROP COLUMN IF EXISTS prep_duration;

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS video_with_prep_url VARCHAR(500);

ALTER TABLE interview_responses
  ADD COLUMN IF NOT EXISTS prep_duration INTEGER;
