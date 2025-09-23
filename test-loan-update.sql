-- Test script to check if basic loan updates work
-- Run this in Supabase SQL Editor

-- First, let's see what loans exist
SELECT id, user_id, amount, status, application_date 
FROM loans 
LIMIT 5;

-- Test a simple status update (replace 'your-loan-id' with an actual loan ID)
-- UPDATE loans 
-- SET status = 'approved' 
-- WHERE id = 'your-loan-id';

-- Check if the update worked
-- SELECT id, status, updated_at 
-- FROM loans 
-- WHERE id = 'your-loan-id';
