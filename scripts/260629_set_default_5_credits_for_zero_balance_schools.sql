-- File: 260629_set_default_5_credits_for_zero_balance_schools.sql
-- Purpose: Give every existing school a baseline of 5 credits.
--          Schools that currently have 0 credits are bumped to 5.
--          Schools that already have a non-zero (previously assigned) balance
--          are left untouched.
-- Affected Tables: schools, credit_transactions
-- Dependencies: None
-- Date: 2026-06-29
--
-- Context (Trello ekOGHGjc): "Set default 5 credit for each school and new added schools".
--   - If current school has 0 credit, set it to 5.
--   - If current school has been assigned credit that is not 0, don't change.
--   - New schools added by super user default to 5 credits (handled in app code).
--
-- The reserved internal "_system" school is excluded. Password fields are not
-- touched, per the project's password-protection rules.
--
-- Rollback (manual, if ever needed): there is no automatic rollback. The
-- admin_adjustment credit_transactions rows created below record the +5 delta
-- for audit purposes.

BEGIN;

-- 1) Record the adjustment for audit/history before mutating balances.
INSERT INTO public.credit_transactions (id, school_id, amount, transaction_type, payment_status, created_at)
SELECT
  gen_random_uuid(),
  s.id,
  5 - s.credits_balance,
  'admin_adjustment',
  'completed',
  now()
FROM public.schools s
WHERE s.credits_balance = 0
  AND s.code IS DISTINCT FROM '_system';

-- 2) Bump zero-balance schools to the new default of 5 credits.
UPDATE public.schools
SET credits_balance = 5,
    updated_at = now()
WHERE credits_balance = 0
  AND code IS DISTINCT FROM '_system';

COMMIT;
