# Fix Advance Payments in Reports - Complete Guide

## Problem
Advance payments entered during booking are not showing up in reports because the database schema is missing the required fields and the API is not properly handling advance payment data.

## Solution Steps

### Step 1: Apply Database Migration
Run the following SQL script in your Supabase SQL Editor to add the missing database fields and tables:

```sql
-- Fix advance payments - ensure all required columns and tables exist
-- Run this in Supabase SQL Editor

-- 1. Add advance payment columns to bookings table if they don't exist
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'advance_amount'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN advance_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'advance_payment_method'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN advance_payment_method TEXT;
    END IF;
END $;

-- 2. Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS on payments table if it exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "authenticated_can_read_payments" ON public.payments;
        DROP POLICY IF EXISTS "authenticated_can_manage_payments" ON public.payments;
        
        -- Create RLS policies
        CREATE POLICY "authenticated_can_read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
        CREATE POLICY "authenticated_can_manage_payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $;

-- 4. Add total_paid column to invoices if it doesn't exist
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10, 2) DEFAULT 0;

-- 5. Create or replace function to update total_paid when payments are added
CREATE OR REPLACE FUNCTION update_invoice_total_paid()
RETURNS TRIGGER AS $
BEGIN
    -- Update the total_paid amount in invoices table
    UPDATE public.invoices 
    SET total_paid = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.payments 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    payment_status = CASE 
        WHEN (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ) >= total THEN 'paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ) > 0 THEN 'partial'
        ELSE 'pending'
    END
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update total_paid
DROP TRIGGER IF EXISTS update_invoice_total_paid_trigger ON public.payments;
CREATE TRIGGER update_invoice_total_paid_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total_paid();

-- 7. Migrate existing advance payments to payments table (only if they don't already exist)
INSERT INTO public.payments (invoice_id, amount, payment_method, notes, created_at)
SELECT 
    i.id as invoice_id,
    b.advance_amount as amount,
    COALESCE(b.advance_payment_method, 'cash') as payment_method,
    'Advance payment during booking' as notes,
    i.created_at
FROM public.invoices i
JOIN public.bookings b ON i.booking_id = b.id
WHERE b.advance_amount > 0
AND NOT EXISTS (
    SELECT 1 FROM public.payments p 
    WHERE p.invoice_id = i.id 
    AND p.notes = 'Advance payment during booking'
);

-- 8. Update total_paid for all existing invoices
UPDATE public.invoices 
SET total_paid = COALESCE((
    SELECT SUM(amount) 
    FROM public.payments 
    WHERE invoice_id = invoices.id
), 0);

-- 9. Update payment status based on total_paid
UPDATE public.invoices 
SET payment_status = CASE 
    WHEN total_paid >= total THEN 'paid'
    WHEN total_paid > 0 THEN 'partial'
    ELSE 'pending'
END;

SELECT 'Advance payment system fixed successfully!' as message;
```

### Step 2: Verify the Fix

After running the migration, the system will:

1. **Store advance payments properly**: When creating a booking with advance payment, the amount and method will be saved to the `bookings` table
2. **Create payment records**: Advance payments will automatically create entries in the `payments` table
3. **Show in reports**: The Reports page will now display advance payments with proper categorization by payment method (GPay, Cash, MIM)
4. **Track payment status**: Invoices will show correct payment status (pending, partial, paid) based on advance payments

### Step 3: Test the System

1. Create a new booking with an advance payment
2. Check that the advance amount and payment method are saved
3. Go to Reports page and verify the advance payment appears in the correct payment method category
4. Verify the payment shows up in the transaction list with "Advance Payment" badge

## What Was Fixed

### Database Schema
- Added `advance_amount` and `advance_payment_method` columns to `bookings` table
- Created `payments` table to track all payment transactions
- Added `total_paid` column to `invoices` table
- Created triggers to automatically update payment status

### API Changes
- Updated booking creation to save advance payment data
- Modified booking and invoice retrieval to include advance payment information
- Added automatic payment record creation for advance payments

### Reports Integration
- Reports now read advance payment data from the database
- Advance payments are properly categorized by payment method
- Transaction list shows advance payments with proper badges and dates

## Benefits

1. **Complete Payment Tracking**: All payments (advance and final) are now tracked in the system
2. **Accurate Reports**: Reports show real-time payment data including advance payments
3. **Payment Method Breakdown**: Clear separation of GPay, Cash, and MIM payments
4. **Historical Data**: Existing bookings with advance payments are migrated to the new system
5. **Future-Proof**: New bookings will automatically work with the improved system

The advance payment system is now fully integrated and will show all payments in reports correctly.