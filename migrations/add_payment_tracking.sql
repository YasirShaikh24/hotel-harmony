-- Create payments table to track multiple payments per invoice
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy for payments
CREATE POLICY "authenticated_can_read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add payment_history column to invoices to track total paid amount
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10, 2) DEFAULT 0;

-- Function to update total_paid when payments are added
CREATE OR REPLACE FUNCTION update_invoice_total_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total_paid amount in invoices table
    UPDATE public.invoices 
    SET total_paid = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.payments 
        WHERE invoice_id = NEW.invoice_id
    ),
    payment_status = CASE 
        WHEN (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = NEW.invoice_id
        ) >= total THEN 'paid'
        WHEN (
            SELECT COALESCE(SUM(amount), 0) 
            FROM public.payments 
            WHERE invoice_id = NEW.invoice_id
        ) > 0 THEN 'partial'
        ELSE 'pending'
    END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update total_paid
CREATE TRIGGER update_invoice_total_paid_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total_paid();

-- Migrate existing advance payments to payments table
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

-- Update total_paid for existing invoices
UPDATE public.invoices 
SET total_paid = COALESCE((
    SELECT SUM(amount) 
    FROM public.payments 
    WHERE invoice_id = invoices.id
), 0);

-- Update payment status based on total_paid
UPDATE public.invoices 
SET payment_status = CASE 
    WHEN total_paid >= total THEN 'paid'
    WHEN total_paid > 0 THEN 'partial'
    ELSE 'pending'
END;

SELECT 'Payment tracking system created successfully!' as message;