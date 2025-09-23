-- Debug script to check loan approval issues
-- Run this in Supabase SQL Editor step by step

-- Step 1: Check if loans table exists and has the right columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;

-- Step 2: Check if there are any loans in the table
SELECT id, user_id, amount, status, application_date 
FROM loans 
LIMIT 5;

-- Step 3: Check if you can update a loan status (replace 'your-loan-id' with actual ID)
-- First, find a loan ID:
SELECT id, status FROM loans WHERE status = 'pending' LIMIT 1;

-- Step 4: Test a simple update (uncomment and replace with actual loan ID)
-- UPDATE loans 
-- SET status = 'approved' 
-- WHERE id = 'your-actual-loan-id-here';

-- Step 5: Check if the update worked
-- SELECT id, status, updated_at FROM loans WHERE id = 'your-actual-loan-id-here';

-- Step 6: Check RLS policies on loans table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'loans';
