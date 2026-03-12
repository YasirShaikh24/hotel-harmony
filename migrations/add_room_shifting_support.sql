-- Migration: Add Room Shifting Support
-- This migration adds support for room shifting functionality

-- Add room shifting log table to track room changes
CREATE TABLE IF NOT EXISTS public.room_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    old_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    new_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    price_difference DECIMAL(10, 2) DEFAULT 0,
    shifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shift_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on room_shifts table
ALTER TABLE public.room_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for room_shifts
CREATE POLICY "authenticated_can_read_room_shifts" ON public.room_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_room_shifts" ON public.room_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add function to automatically update room availability based on checkout dates
CREATE OR REPLACE FUNCTION public.auto_checkout_expired_bookings()
RETURNS void AS $$
BEGIN
    -- Update bookings that have passed checkout date to 'checked_out'
    -- and make their rooms available
    UPDATE public.bookings 
    SET status = 'checked_out', updated_at = now()
    WHERE status = 'checked_in' 
    AND check_out < CURRENT_DATE;
    
    -- Update room status to available for checked out bookings
    UPDATE public.rooms 
    SET status = 'available', updated_at = now()
    WHERE id IN (
        SELECT DISTINCT room_id 
        FROM public.bookings 
        WHERE status = 'checked_out' 
        AND room_id IS NOT NULL
    ) AND status = 'occupied';
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called daily to auto-checkout expired bookings
-- This can be set up as a cron job or called manually
SELECT public.auto_checkout_expired_bookings();

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_checkout_expired_bookings() IS 'Automatically checks out bookings that have passed their checkout date and makes rooms available';
COMMENT ON TABLE public.room_shifts IS 'Tracks room shifting history for bookings';