-- Add check-in and check-out time fields to bookings table
-- Using VARCHAR to store AM/PM format (e.g., "2:00 PM", "11:00 AM")

-- First, let's check if the columns exist and what type they are
DO $$
BEGIN
    -- Add time fields as VARCHAR if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'check_in_time'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN check_in_time VARCHAR(10) DEFAULT '2:00 PM';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'check_out_time'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN check_out_time VARCHAR(10) DEFAULT '11:00 AM';
    END IF;

    -- Add advance payment fields if they don't exist
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
END $$;

-- Handle existing TIME columns and convert them to VARCHAR with AM/PM format
DO $$
BEGIN
    -- Check if check_in_time exists as TIME type and convert to VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'check_in_time' 
        AND data_type = 'time without time zone'
    ) THEN
        -- Add a temporary column
        ALTER TABLE public.bookings ADD COLUMN check_in_time_temp VARCHAR(10);
        
        -- Convert existing TIME values to AM/PM format
        UPDATE public.bookings 
        SET check_in_time_temp = CASE 
            WHEN check_in_time IS NULL THEN '2:00 PM'
            WHEN EXTRACT(HOUR FROM check_in_time) = 0 THEN '12:' || LPAD(EXTRACT(MINUTE FROM check_in_time)::TEXT, 2, '0') || ' AM'
            WHEN EXTRACT(HOUR FROM check_in_time) < 12 THEN EXTRACT(HOUR FROM check_in_time)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM check_in_time)::TEXT, 2, '0') || ' AM'
            WHEN EXTRACT(HOUR FROM check_in_time) = 12 THEN '12:' || LPAD(EXTRACT(MINUTE FROM check_in_time)::TEXT, 2, '0') || ' PM'
            ELSE (EXTRACT(HOUR FROM check_in_time) - 12)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM check_in_time)::TEXT, 2, '0') || ' PM'
        END;
        
        -- Drop the old column and rename the new one
        ALTER TABLE public.bookings DROP COLUMN check_in_time;
        ALTER TABLE public.bookings RENAME COLUMN check_in_time_temp TO check_in_time;
    END IF;

    -- Check if check_out_time exists as TIME type and convert to VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'check_out_time' 
        AND data_type = 'time without time zone'
    ) THEN
        -- Add a temporary column
        ALTER TABLE public.bookings ADD COLUMN check_out_time_temp VARCHAR(10);
        
        -- Convert existing TIME values to AM/PM format
        UPDATE public.bookings 
        SET check_out_time_temp = CASE 
            WHEN check_out_time IS NULL THEN '11:00 AM'
            WHEN EXTRACT(HOUR FROM check_out_time) = 0 THEN '12:' || LPAD(EXTRACT(MINUTE FROM check_out_time)::TEXT, 2, '0') || ' AM'
            WHEN EXTRACT(HOUR FROM check_out_time) < 12 THEN EXTRACT(HOUR FROM check_out_time)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM check_out_time)::TEXT, 2, '0') || ' AM'
            WHEN EXTRACT(HOUR FROM check_out_time) = 12 THEN '12:' || LPAD(EXTRACT(MINUTE FROM check_out_time)::TEXT, 2, '0') || ' PM'
            ELSE (EXTRACT(HOUR FROM check_out_time) - 12)::TEXT || ':' || LPAD(EXTRACT(MINUTE FROM check_out_time)::TEXT, 2, '0') || ' PM'
        END;
        
        -- Drop the old column and rename the new one
        ALTER TABLE public.bookings DROP COLUMN check_out_time;
        ALTER TABLE public.bookings RENAME COLUMN check_out_time_temp TO check_out_time;
    END IF;
END $$;

-- Update any NULL values to default times
UPDATE public.bookings 
SET check_in_time = '2:00 PM' 
WHERE check_in_time IS NULL;

UPDATE public.bookings 
SET check_out_time = '11:00 AM' 
WHERE check_out_time IS NULL;

-- Make email optional in customers table (it might already be optional)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'email' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.customers ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

SELECT 'Migration completed: Added time fields with AM/PM format to bookings table' as message;