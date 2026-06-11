-- File: 260608_add_school_level.sql
-- Purpose: Add `level` field to School to support the rating gate concept.
--          A school is either "k12" or "undergraduate". K-12 schools skip
--          AI scoring/rating; undergraduate schools keep the existing rating flow.
-- Affected Tables: schools
-- Dependencies: None
-- Date: 2026-06-08
--
-- This script adds a NOT NULL `level` column defaulting to 'k12' so existing
-- rows remain valid. Use scripts/260608_backfill_school_level.js afterwards to
-- reclassify universities/colleges as 'undergraduate'.
--
-- Rollback: ALTER TABLE schools DROP COLUMN level;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'k12';
