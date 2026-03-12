-- Additional update to ensure payment system works correctly
-- Run this AFTER the previous migration

-- 1. Ensure payments table has correct structure
ALTER TABLE public.payments ALTER COLUMN payment_method SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN amount SET NOT NULL;

-- 2. Update the trigger function to handle all cases properly
CREATE OR REPLACE FUNCTION update_invoice_total_paid()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total DECIMAL(10, 2);
    total_payments DECIMAL(10, 2);
BEGIN
    -- Get the invoice total and current payments
    SELECT 
        i.total,
        COALESCE(SUM(p.amount), 0)
    INTO invoice_total, total_payments
    FROM public.invoices i
    LEFT JOIN public.payments p ON p.invoice_id = i.id
    WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    GROUP BY i.total;
    
    -- Update the invoice with new totals and status
    UPDATE public.invoices 
    SET 
        total_paid = total_payments,
        payment_status = CASE 
            WHEN total_payments >= invoice_total THEN 'paid'
            WHEN total_payments > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS update_invoice_total_paid_trigger ON public.payments;
CREATE TRIGGER update_invoice_total_paid_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total_paid();

-- 4. Update all existing invoices to have correct total_paid and status
UPDATE public.invoices 
SET 
    total_paid = COALESCE((
        SELECT SUM(amount) 
        FROM public.payments 
        WHERE invoice_id = invoices.id
    ), 0),
    payment_status = CASE 
        WHEN COALESCE((
            SELECT SUM(amount) 
            FROM public.payments 
            WHERE invoice_id = invoices.id
        ), 0) >= total THEN 'paid'
        WHEN COALESCE((
            SELECT SUM(amount) 
            FROM public.payments 
            WHERE invoice_id = invoices.id
        ), 0) > 0 THEN 'partial'
        ELSE 'pending'
    END;

SELECT 'Payment system updated successfully!' as message;