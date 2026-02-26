-- Add customer_gst_number column to customers table
-- Run this in Supabase SQL Editor if the column doesn't exist

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_gst_number TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN public.customers.customer_gst_number IS 'GST number for customer invoicing';
