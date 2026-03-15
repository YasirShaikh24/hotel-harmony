-- Fix database schema issues
-- Run this in Supabase SQL Editor

-- 1. Add missing customer_gst_number column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_gst_number TEXT;

-- 2. Verify all required columns exist in customers table
DO $$ 
BEGIN
    -- Ensure aadhar_encrypted exists and is nullable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'aadhar_encrypted'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN aadhar_encrypted TEXT;
    END IF;
    
    -- Ensure address exists and is nullable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'address'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN address TEXT;
    END IF;
END $$;

-- 3. Verify document fields exist in bookings table (they should already exist from your migration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'document_name'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN document_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'document_number'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN document_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'custom_document_name'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN custom_document_name VARCHAR(100);
    END IF;
END $$;

-- 4. Verify the schema is correct
SELECT 'Schema fix completed!' as message;

-- 5. Check final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('customer_gst_number', 'aadhar_encrypted', 'address')
ORDER BY column_name;