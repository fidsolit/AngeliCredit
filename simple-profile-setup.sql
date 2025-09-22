-- Simple Profile Setup Migration
-- Run this in your Supabase SQL editor to add profile setup fields

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS house_number TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS barangay TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS landline TEXT,
ADD COLUMN IF NOT EXISTS work_from_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS main_income_source TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS payout_frequency TEXT,
ADD COLUMN IF NOT EXISTS payout_days TEXT,
ADD COLUMN IF NOT EXISTS employment_company TEXT,
ADD COLUMN IF NOT EXISTS employment_position TEXT,
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_completion_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_main_income_source ON profiles(main_income_source);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);

-- Update RLS policies
CREATE POLICY "Users can update their own profile setup" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a simple function to update profile completion
CREATE OR REPLACE FUNCTION update_profile_completion_simple(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_count INTEGER := 0;
BEGIN
  -- Count completed fields
  SELECT 
    (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END) +
    (CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END) +
    (CASE WHEN house_number IS NOT NULL AND house_number != '' THEN 1 ELSE 0 END) +
    (CASE WHEN province IS NOT NULL AND province != '' THEN 1 ELSE 0 END) +
    (CASE WHEN city IS NOT NULL AND city != '' THEN 1 ELSE 0 END) +
    (CASE WHEN postal_code IS NOT NULL AND postal_code != '' THEN 1 ELSE 0 END) +
    (CASE WHEN main_income_source IS NOT NULL AND main_income_source != '' THEN 1 ELSE 0 END) +
    (CASE WHEN monthly_income > 0 THEN 1 ELSE 0 END) +
    (CASE WHEN id_document_url IS NOT NULL AND id_document_url != '' THEN 1 ELSE 0 END) +
    (CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 1 ELSE 0 END)
  INTO completion_count
  FROM profiles 
  WHERE id = user_id;
  
  -- Update profile completion
  UPDATE profiles 
  SET 
    profile_completion_step = LEAST(5, CEIL(completion_count / 2.0)),
    profile_completed = (completion_count >= 8),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;
