-- Complete fix for loans table
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
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

-- Check if the columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'loans' 
ORDER BY ordinal_position;
