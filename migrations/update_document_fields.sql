-- Migration to replace aadhar_number with document_name and document_number
-- Run this query to update your database schema

-- Add new columns
ALTER TABLE bookings ADD COLUMN document_name VARCHAR(100);
ALTER TABLE bookings ADD COLUMN document_number VARCHAR(50);
ALTER TABLE bookings ADD COLUMN custom_document_name VARCHAR(100);

-- Optional: Migrate existing aadhar data to new format
-- Uncomment the following lines if you want to preserve existing aadhar data
-- UPDATE bookings SET document_name = 'Aadhar Card', document_number = aadhar_number WHERE aadhar_number IS NOT NULL AND aadhar_number != '';

-- Drop the old column (uncomment when ready)
-- ALTER TABLE bookings DROP COLUMN aadhar_number;