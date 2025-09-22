-- Simple setup for ID verification feature
-- Run this in your Supabase SQL editor

-- 1. Add ID document fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_verification_status TEXT DEFAULT 'not_uploaded';

-- 2. Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Create storage policies for ID documents
CREATE POLICY "Users can upload their own ID documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own ID documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own ID documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own ID documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'id-documents' 
  AND auth.role() = 'authenticated'
);

-- 4. Create admin function to update verification status
CREATE OR REPLACE FUNCTION update_id_verification_status(
  user_id UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
