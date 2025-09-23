-- Test admin update permissions
-- Run this in Supabase SQL Editor

-- Step 1: Check if you have admin access
SELECT id, email, is_admin 
FROM profiles 
WHERE is_admin = true;

-- Step 2: Check if there are any pending loans
SELECT id, user_id, amount, status, application_date 
FROM loans 
WHERE status = 'pending';

-- Step 3: Try to update a loan (replace with actual loan ID)
-- UPDATE loans 
-- SET status = 'approved' 
-- WHERE id = 'replace-with-actual-loan-id';

-- Step 4: Check if the update worked
-- SELECT id, status, updated_at 
-- FROM loans 
-- WHERE id = 'replace-with-actual-loan-id';
