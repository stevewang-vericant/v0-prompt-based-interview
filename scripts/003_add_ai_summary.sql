-- Add ai_summary column to interviews table
-- This script adds the ai_summary field to store AI-generated summaries

-- Add ai_summary column to interviews table
ALTER TABLE interviews 
ADD COLUMN ai_summary TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN interviews.ai_summary IS 'AI-generated summary of the interview transcription';

-- Update existing records to have NULL ai_summary (they will be populated when transcription completes)
UPDATE interviews 
SET ai_summary = NULL 
WHERE ai_summary IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interviews' 
AND column_name = 'ai_summary';
