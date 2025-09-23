-- Check current loans table schema
-- Run this in Supabase SQL Editor to see what columns exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;
