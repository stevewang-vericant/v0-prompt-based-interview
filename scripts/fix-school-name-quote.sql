-- Fix school name with leading single quote
-- Update 'lolani School to Iolani School

UPDATE public.schools
SET name = 'Iolani School',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'lolani-school';

-- Verify the fix
SELECT name, code FROM schools WHERE code = 'lolani-school';
