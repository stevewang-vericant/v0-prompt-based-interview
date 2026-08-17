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
