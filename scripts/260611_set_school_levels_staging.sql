-- File: 260611_set_school_levels_staging.sql
-- Purpose: Set schools.level for the staging environment after the `level` column
--          is added (via prisma db push). The staging school list is overwhelmingly
--          K-12 boarding/prep schools; only genuine higher-ed institutions get
--          'undergraduate'. Classification was verified against each school's grade
--          range (incl. web research for ambiguous "College"/"University"/"Institute"
--          names, e.g. St. Michaels University School = JK-12, Villanova College = Gr.4-12,
--          Bronte College = Gr.9-12, The High School at VIU = Gr.10-12).
-- Affected Tables: schools (only the `level` column; never touches password_hash)
-- Date: 2026-06-11
--
-- The `level` column defaults to 'k12', so every existing row is already K-12 after
-- the migration. This script only promotes the verified undergraduate-level entries.
--
-- Undergraduate entries (confirmed with the product owner):
--   - mit         : Massachusetts Institute of Technology (real university)
--   - vericant    : internal/company account (used for scoring-flow testing)
--   - super-admin : super administrator account (used for scoring-flow testing)
--
-- Rollback: UPDATE schools SET level = 'k12' WHERE code IN ('mit','vericant','super-admin');

UPDATE schools
SET level = 'undergraduate'
WHERE code IN ('mit', 'vericant', 'super-admin');
