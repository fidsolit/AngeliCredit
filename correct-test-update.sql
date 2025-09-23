-- Correct SQL syntax for testing loan updates
-- Run this in Supabase SQL Editor

-- First, let's see what loans exist with pending status
SELECT id, user_id, amount, status, application_date 
FROM loans 
WHERE status = 'pending'
LIMIT 5;

-- Test a simple status update (this will update the first pending loan)
UPDATE loans 
SET status = 'approved' 
WHERE status = 'pending' 
LIMIT 1;

-- Check if the update worked
SELECT id, status, updated_at 
FROM loans 
WHERE status = 'approved'
ORDER BY updated_at DESC
LIMIT 5;
