-- Complete Profile Setup Migration
-- This migration adds all the new profile fields for comprehensive user setup

-- Add new columns to profiles table for complete profile setup
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_main_income_source ON profiles(main_income_source);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);

-- Update RLS policies to allow users to update their own profile fields
CREATE POLICY "Users can update their own profile setup" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 10;
BEGIN
  -- Check each required field and increment score
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND full_name IS NOT NULL 
    AND full_name != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND phone IS NOT NULL 
    AND phone != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND house_number IS NOT NULL 
    AND house_number != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND province IS NOT NULL 
    AND province != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND city IS NOT NULL 
    AND city != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND postal_code IS NOT NULL 
    AND postal_code != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND main_income_source IS NOT NULL 
    AND main_income_source != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND monthly_income > 0
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND id_document_url IS NOT NULL 
    AND id_document_url != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND avatar_url IS NOT NULL 
    AND avatar_url != ''
  ) THEN completion_score := completion_score + 1; END IF;
  
  -- Return percentage
  RETURN (completion_score * 100) / total_fields;
END;
$$;

-- Create a view for profile completion dashboard
CREATE OR REPLACE VIEW profile_completion_dashboard AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.province,
  p.city,
  p.main_income_source,
  p.monthly_income,
  p.profile_completion_step,
  p.profile_completed,
  p.id_verification_status,
  calculate_profile_completion(p.id) as completion_percentage,
  p.created_at,
  p.updated_at
FROM profiles p
ORDER BY p.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON profile_completion_dashboard TO authenticated;

-- Create a policy to allow users to view their own completion data
CREATE POLICY "Users can view their own profile completion" ON profile_completion_dashboard
FOR SELECT USING (auth.uid() = id);

-- Create a policy to allow admins to view all completion data
CREATE POLICY "Admins can view all profile completion data" ON profile_completion_dashboard
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a function to update profile completion status
CREATE OR REPLACE FUNCTION update_profile_completion(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_percentage INTEGER;
  current_step INTEGER;
BEGIN
  -- Calculate completion percentage
  completion_percentage := calculate_profile_completion(user_id);
  
  -- Determine current step based on completion
  IF completion_percentage < 20 THEN
    current_step := 1;
  ELSIF completion_percentage < 40 THEN
    current_step := 2;
  ELSIF completion_percentage < 60 THEN
    current_step := 3;
  ELSIF completion_percentage < 80 THEN
    current_step := 4;
  ELSE
    current_step := 5;
  END IF;
  
  -- Update profile with completion data
  UPDATE profiles 
  SET 
    profile_completion_step = current_step,
    profile_completed = (completion_percentage >= 80),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Log the completion update
  INSERT INTO activity_log (user_id, activity_type, description, created_at)
  VALUES (
    user_id,
    'profile_completion',
    'Profile completion updated to ' || completion_percentage || '%',
    NOW()
  );
END;
$$;

-- Create a trigger to automatically update profile completion when profile is updated
CREATE OR REPLACE FUNCTION trigger_update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile completion for the user
  PERFORM update_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to profiles table
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON profiles;
CREATE TRIGGER update_profile_completion_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_profile_completion();

-- Add comments to the new columns
COMMENT ON COLUMN profiles.house_number IS 'House number, unit number, or street name';
COMMENT ON COLUMN profiles.province IS 'Province or state';
COMMENT ON COLUMN profiles.city IS 'City or municipality';
COMMENT ON COLUMN profiles.barangay IS 'Barangay or district (optional)';
COMMENT ON COLUMN profiles.postal_code IS 'Postal code or zip code';
COMMENT ON COLUMN profiles.landline IS 'Landline phone number (optional)';
COMMENT ON COLUMN profiles.work_from_home IS 'Whether the user works from home';
COMMENT ON COLUMN profiles.main_income_source IS 'Primary source of income: employment, business, remittance, freelance';
COMMENT ON COLUMN profiles.business_name IS 'Name of the business (if applicable)';
COMMENT ON COLUMN profiles.payout_frequency IS 'How often the user gets paid';
COMMENT ON COLUMN profiles.payout_days IS 'Which days of the month the user gets paid';
COMMENT ON COLUMN profiles.employment_company IS 'Company name (if employed)';
COMMENT ON COLUMN profiles.employment_position IS 'Job position (if employed)';
COMMENT ON COLUMN profiles.monthly_income IS 'Monthly income amount in PHP';
COMMENT ON COLUMN profiles.profile_completion_step IS 'Current step in profile completion (1-5)';
COMMENT ON COLUMN profiles.profile_completed IS 'Whether the profile setup is completed';

-- Insert some sample data for testing (optional)
-- You can uncomment this section if you want to add sample data
/*
INSERT INTO profiles (
  id, email, full_name, phone, house_number, province, city, 
  postal_code, main_income_source, monthly_income, profile_completion_step
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'sample@example.com',
  'Sample User',
  '+639123456789',
  '123 Sample Street',
  'Cebu',
  'Cebu City',
  '6000',
  'employment',
  25000.00,
  3
) ON CONFLICT (id) DO NOTHING;
*/
