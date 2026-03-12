-- Test script to verify advance payment system is working
-- Run this AFTER applying the main migration

-- 1. Check if required columns exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'advance_amount'
        ) THEN '✓ advance_amount column exists'
        ELSE '✗ advance_amount column missing'
    END as advance_amount_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'advance_payment_method'
        ) THEN '✓ advance_payment_method column exists'
        ELSE '✗ advance_payment_method column missing'
    END as advance_method_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'payments'
        ) THEN '✓ payments table exists'
        ELSE '✗ payments table missing'
    END as payments_table_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'total_paid'
        ) THEN '✓ total_paid column exists'
        ELSE '✗ total_paid column missing'
    END as total_paid_check;

-- 2. Check if any existing bookings have advance payments
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN advance_amount > 0 THEN 1 END) as bookings_with_advance,
    SUM(COALESCE(advance_amount, 0)) as total_advance_amount
FROM public.bookings;

-- 3. Check payment records
SELECT 
    COUNT(*) as total_payment_records,
    COUNT(CASE WHEN notes = 'Advance payment during booking' THEN 1 END) as advance_payment_records,
    SUM(CASE WHEN notes = 'Advance payment during booking' THEN amount ELSE 0 END) as total_advance_in_payments
FROM public.payments;

-- 4. Check invoice payment status
SELECT 
    payment_status,
    COUNT(*) as count,
    SUM(total) as total_amount,
    SUM(COALESCE(total_paid, 0)) as total_paid_amount
FROM public.invoices
GROUP BY payment_status
ORDER BY payment_status;

-- 5. Sample query that the Reports page will use
SELECT 
    b.id as booking_id,
    b.advance_amount,
    b.advance_payment_method,
    i.total as invoice_total,
    i.total_paid,
    i.payment_status,
    p.amount as payment_amount,
    p.payment_method as payment_method_from_payments,
    p.notes
FROM public.bookings b
LEFT JOIN public.invoices i ON i.booking_id = b.id
LEFT JOIN public.payments p ON p.invoice_id = i.id
WHERE b.advance_amount > 0
ORDER BY b.created_at DESC
LIMIT 5;

SELECT 'Advance payment system test completed!' as message;