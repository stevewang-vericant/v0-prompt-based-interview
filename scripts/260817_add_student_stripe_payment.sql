-- File: 260817_add_student_stripe_payment.sql
-- Purpose: Add per-school billing mode and student Stripe payment records
-- Affected Tables: schools, interview_payments
-- Dependencies: None
-- Date: 2026-08-17
--
-- Super admins can set a school to consume credits or require students to pay
-- via Stripe before an interview starts. Default remains credits.
--
-- Rollback:
--   ALTER TABLE interviews DROP COLUMN IF EXISTS payment_id;
--   ALTER TABLE interviews DROP COLUMN IF EXISTS attempt_number;
--   DROP TABLE IF EXISTS payment_access_codes;
--   DROP TABLE IF EXISTS interview_payments;
--   ALTER TABLE schools DROP COLUMN IF EXISTS billing_mode;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NOT NULL DEFAULT 'credits';

CREATE TABLE IF NOT EXISTS interview_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id VARCHAR(255) NOT NULL UNIQUE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_email VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_info JSONB,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  stripe_checkout_session_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS interview_payments_school_id_idx ON interview_payments(school_id);
CREATE INDEX IF NOT EXISTS interview_payments_status_idx ON interview_payments(status);

ALTER TABLE interview_payments
  ADD COLUMN IF NOT EXISTS entitlement_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS restart_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

UPDATE interview_payments
SET entitlement_status = 'active'
WHERE status = 'paid' AND entitlement_status = 'pending';

CREATE INDEX IF NOT EXISTS interview_payments_entitlement_status_idx
  ON interview_payments(entitlement_status);

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES interview_payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS interviews_payment_id_idx ON interviews(payment_id);

UPDATE interviews i
SET payment_id = p.id
FROM interview_payments p
WHERE i.interview_id = p.interview_id
  AND i.payment_id IS NULL;

CREATE TABLE IF NOT EXISTS payment_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES interview_payments(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS payment_access_codes_payment_id_idx
  ON payment_access_codes(payment_id);
CREATE INDEX IF NOT EXISTS payment_access_codes_expires_at_idx
  ON payment_access_codes(expires_at);
