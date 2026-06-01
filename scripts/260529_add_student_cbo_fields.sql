-- File: 260529_add_student_cbo_fields.sql
-- Purpose: Add CBO usage fields to Student personal information
-- Affected Tables: students
-- Dependencies: None
-- Date: 2026-05-29
--
-- Adds nullable fields for recording whether a student is using a CBO and,
-- when applicable, the selected CBO organization name.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS uses_cbo BOOLEAN,
  ADD COLUMN IF NOT EXISTS cbo_organization VARCHAR(255);
