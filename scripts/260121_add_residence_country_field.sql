-- File: 260121_add_residence_country_field.sql
-- Purpose: Add residence_country field to Student model to support student demographics collection
-- Affected Tables: students
-- Dependencies: None
-- Date: 2026-01-21
--
-- This script adds a nullable residence_country field to the students table.
-- The field is optional and can be NULL for existing records, but will be required
-- for new student registrations during the interview process.

ALTER TABLE students ADD COLUMN IF NOT EXISTS residence_country VARCHAR(255) NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN students.residence_country IS 'Country of residence for the student. Required field for new student registrations.';
