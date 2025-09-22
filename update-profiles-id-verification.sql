-- Update profiles table to include ID document verification fields
-- This migration adds support for ID document upload and verification status

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_verification_status TEXT DEFAULT 'not_uploaded';

-- Create an index on id_verification_status for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_id_verification_status 
ON profiles(id_verification_status);

-- Update the RLS policies to allow users to update their own ID document
-- Allow users to update their own ID document fields
CREATE POLICY "Users can update their own ID document" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own ID document fields
CREATE POLICY "Users can insert their own ID document" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create storage bucket for ID documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for ID documents bucket
-- Allow authenticated users to upload their own ID documents
CREATE POLICY "Users can upload their own ID documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own ID documents
CREATE POLICY "Users can view their own ID documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own ID documents
CREATE POLICY "Users can update their own ID documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own ID documents
CREATE POLICY "Users can delete their own ID documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all ID documents for verification
CREATE POLICY "Admins can view all ID documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a function to update ID verification status (for admin use)
CREATE OR REPLACE FUNCTION update_id_verification_status(
  user_id UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update ID verification status';
  END IF;
  
  -- Validate status values
  IF new_status NOT IN ('not_uploaded', 'pending', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification status: %', new_status;
  END IF;
  
  -- Update the user's ID verification status
  UPDATE profiles 
  SET 
    id_verification_status = new_status,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Log the verification status change
  INSERT INTO activity_log (user_id, activity_type, description, created_at)
  VALUES (
    user_id,
    'id_verification',
    'ID verification status updated to: ' || new_status,
    NOW()
  );
END;
$$;

-- Create a view for admin ID verification dashboard
CREATE OR REPLACE VIEW admin_id_verification AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.id_document_url,
  p.id_verification_status,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN p.id_verification_status = 'verified' THEN 'Verified'
    WHEN p.id_verification_status = 'pending' THEN 'Pending Review'
    WHEN p.id_verification_status = 'rejected' THEN 'Rejected'
    ELSE 'Not Uploaded'
  END as status_display
FROM profiles p
WHERE p.id_document_url IS NOT NULL
ORDER BY p.updated_at DESC;

-- Grant access to the view for admin users
GRANT SELECT ON admin_id_verification TO authenticated;

-- Create a policy to allow admins to access the verification view
CREATE POLICY "Admins can view ID verification dashboard" ON admin_id_verification
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add comments to the new columns
COMMENT ON COLUMN profiles.id_document_url IS 'URL of the uploaded ID document in storage';
COMMENT ON COLUMN profiles.id_verification_status IS 'Status of ID verification: not_uploaded, pending, verified, rejected';

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
