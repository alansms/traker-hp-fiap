-- Add approval_status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'pending';

