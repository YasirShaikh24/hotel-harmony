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