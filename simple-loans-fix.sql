-- Simple fix for loans table - add missing columns
-- Run this in your Supabase SQL Editor

-- Add approval_date column
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Add disbursement_date column  
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP WITH TIME ZONE;

-- Add completion_date column
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;
