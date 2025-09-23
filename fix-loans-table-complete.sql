-- Complete fix for loans table - run this in Supabase SQL Editor
-- This will fix all common issues with loan approval

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Step 3: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'loans';

-- Step 4: Create or update RLS policies for admin access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update all loans" ON loans;
DROP POLICY IF EXISTS "Users can view their own loans" ON loans;
DROP POLICY IF EXISTS "Users can insert their own loans" ON loans;

-- Create new policies
CREATE POLICY "Users can view their own loans" ON loans
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans" ON loans
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all loans" ON loans
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can view all loans" ON loans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Step 5: Test the setup
-- Check if you have admin access
SELECT id, email, is_admin 
FROM profiles 
WHERE is_admin = true;

-- Check if there are loans to test with
SELECT id, user_id, amount, status, application_date 
FROM loans 
LIMIT 5;
