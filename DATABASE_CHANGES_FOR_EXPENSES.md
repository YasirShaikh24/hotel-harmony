# Database Changes for Expenses Page

## Run this in Supabase SQL Editor:

```sql
-- Add new columns to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS vendor_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.payment_method IS 'Payment method: cash, bank, card, upi';
COMMENT ON COLUMN public.expenses.receipt_number IS 'Receipt or invoice number for tracking';
COMMENT ON COLUMN public.expenses.receipt_url IS 'URL to uploaded receipt image';
COMMENT ON COLUMN public.expenses.vendor_name IS 'Name of vendor or service provider';
```

## Changes Made:
1. ✅ Added `payment_method` - Track how expense was paid (cash/bank/card/upi)
2. ✅ Added `receipt_number` - Store receipt/invoice numbers for accounting
3. ✅ Added `receipt_url` - Store uploaded receipt images (future feature)
4. ✅ Added `vendor_name` - Track who was paid

## Note:
- All columns are optional (nullable) to maintain backward compatibility
- Existing expense records will work fine
- New expenses can use these enhanced fields
