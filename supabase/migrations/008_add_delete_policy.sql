-- 008_add_delete_policy.sql
-- Add DELETE policy for interviews table to allow bulk deletion

BEGIN;

-- Add DELETE policy for anonymous users (for API routes)
CREATE POLICY "Allow anonymous delete on interviews"
ON interviews
FOR DELETE
TO anon
USING (true);

-- Add DELETE policy for authenticated users (for admin operations)
CREATE POLICY "Allow authenticated delete on interviews"
ON interviews
FOR DELETE
TO authenticated
USING (true);

-- Add DELETE policy for service role (for admin operations)
CREATE POLICY "Allow service role delete on interviews"
ON interviews
FOR DELETE
TO service_role
USING (true);

COMMIT;

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'interviews'
  AND cmd = 'DELETE'
ORDER BY policyname;
