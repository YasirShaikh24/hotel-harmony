-- Simple fix: Add document columns to customers table
-- Run this in Supabase SQL Editor

-- Add document columns if they don't exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS document_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('document_name', 'document_number')
ORDER BY column_name;