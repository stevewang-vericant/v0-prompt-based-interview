-- File: 260521_add_last_login_at.sql
-- Purpose: Track last login time for school admins and legacy school accounts
-- Affected Tables: school_admins, schools
-- Dependencies: None
-- Date: 2026-05-21
--
-- Adds nullable last_login_at columns. Existing rows remain NULL until next login.

ALTER TABLE school_admins
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;
