-- File: 260410_create_external_api_logs.sql
-- Purpose: Create persistent API call history table for third-party integrations (Cathoven scoring)
-- Affected Tables: external_api_logs
-- Dependencies: PostgreSQL database used by Prisma schema
-- Date: 2026-04-10
--
-- This script adds a generic external_api_logs table to track request/response history,
-- status, duration, and errors for debugging production issues.
--
-- Rollback:
--   DROP TABLE IF EXISTS external_api_logs;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS external_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  interview_id VARCHAR(255),
  endpoint VARCHAR(500) NOT NULL,
  request_payload TEXT,
  response_payload TEXT,
  status_code INTEGER,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_provider ON external_api_logs(provider);
CREATE INDEX IF NOT EXISTS idx_external_api_logs_interview_id ON external_api_logs(interview_id);
CREATE INDEX IF NOT EXISTS idx_external_api_logs_created_at ON external_api_logs(created_at DESC);
