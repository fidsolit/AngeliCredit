-- Fix loans table missing columns
-- Add missing columns to loans table

-- Add approval_date column
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Add disbursement_date column  
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP WITH TIME ZONE;

-- Add completion_date column (optional, for future use)
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason column (optional, for future use)
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add notes column (optional, for admin notes)
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update existing loans to have proper timestamps
-- Set approval_date for existing approved loans
UPDATE loans 
SET approval_date = updated_at 
WHERE status = 'approved' AND approval_date IS NULL;

-- Set disbursement_date for existing active loans
UPDATE loans 
SET disbursement_date = updated_at 
WHERE status = 'active' AND disbursement_date IS NULL;

-- Set completion_date for existing completed loans
UPDATE loans 
SET completion_date = updated_at 
WHERE status = 'completed' AND completion_date IS NULL;
