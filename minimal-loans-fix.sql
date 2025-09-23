-- Minimal fix - just ensure the loans table has the basic structure
-- Run this in Supabase SQL Editor

-- Check if loans table exists and has basic columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loans';

-- If the table doesn't have the basic columns, this will help identify the issue
-- The loans table should have at least: id, user_id, amount, status, application_date
