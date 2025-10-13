-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  credits_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase' or 'usage'
  price_paid DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_email VARCHAR(255) NOT NULL,
  student_name VARCHAR(255),
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'registered', 'completed', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  nationality VARCHAR(100),
  id_verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'verified', 'rejected'
  id_document_url VARCHAR(500),
  selfie_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'critical_thinking', 'conversational_fluency', 'general_knowledge'
  prompt_text TEXT NOT NULL,
  preparation_time INTEGER DEFAULT 30, -- seconds
  response_time INTEGER DEFAULT 90, -- seconds
  difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard'
  is_active BOOLEAN DEFAULT true,
  school_id UUID REFERENCES schools(id), -- NULL for standard prompts, school_id for custom prompts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'submitted', 'scored'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  total_score DECIMAL(5, 2),
  fluency_score DECIMAL(5, 2),
  coherence_score DECIMAL(5, 2),
  vocabulary_score DECIMAL(5, 2),
  grammar_score DECIMAL(5, 2),
  pronunciation_score DECIMAL(5, 2),
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'flagged'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview responses table (one per prompt)
CREATE TABLE IF NOT EXISTS interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  video_url VARCHAR(500),
  video_duration INTEGER, -- seconds
  transcript TEXT,
  response_score DECIMAL(5, 2),
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_invitations_school_id ON invitations(school_id);
CREATE INDEX idx_invitations_token ON invitations(invitation_token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_students_invitation_id ON students(invitation_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_interviews_student_id ON interviews(student_id);
CREATE INDEX idx_interviews_school_id ON interviews(school_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interview_responses_interview_id ON interview_responses(interview_id);
CREATE INDEX idx_credit_transactions_school_id ON credit_transactions(school_id);
