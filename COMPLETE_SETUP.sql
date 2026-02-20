-- ============================================
-- COMPLETE HOTEL MANAGEMENT DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'receptionist', 'customer');
CREATE TYPE public.room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning');
CREATE TYPE public.room_type AS ENUM ('single', 'double', 'deluxe', 'suite', 'presidential');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    UNIQUE (user_id, role)
);

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL UNIQUE,
    type room_type NOT NULL DEFAULT 'single',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status room_status NOT NULL DEFAULT 'available',
    floor INTEGER NOT NULL DEFAULT 1,
    amenities TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    aadhar_encrypted TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER DEFAULT 0,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    room_charges DECIMAL(10, 2) NOT NULL DEFAULT 0,
    additional_charges DECIMAL(10, 2) DEFAULT 0,
    cgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create income table
CREATE TABLE public.income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_logs table
CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (allow public read)
CREATE POLICY "allow_public_read_rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_manage_rooms" ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "users_can_view_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "users_can_view_own_roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "authenticated_can_manage_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for customers, bookings, invoices, income, expenses
CREATE POLICY "authenticated_can_read_customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_can_read_bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_bookings" ON public.bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_can_read_invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_can_read_income" ON public.income FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_income" ON public.income FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_can_read_expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_can_read_whatsapp_logs" ON public.whatsapp_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_manage_whatsapp_logs" ON public.whatsapp_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 17 rooms
INSERT INTO public.rooms (room_number, type, price, status, floor, description) VALUES
('101', 'single', 3000, 'occupied', 1, 'Single AC room with modern amenities'),
('102', 'single', 2000, 'available', 1, 'Single Non-AC room with modern amenities'),
('103', 'double', 4500, 'available', 1, 'Double AC room with modern amenities'),
('104', 'double', 3500, 'available', 1, 'Double Non-AC room with modern amenities'),
('105', 'single', 3000, 'available', 1, 'Single AC room with modern amenities'),
('106', 'single', 2000, 'available', 1, 'Single Non-AC room with modern amenities'),
('107', 'double', 4500, 'available', 1, 'Double AC room with modern amenities'),
('108', 'double', 3500, 'available', 1, 'Double Non-AC room with modern amenities'),
('109', 'single', 3000, 'available', 1, 'Single AC room with modern amenities'),
('110', 'double', 4500, 'occupied', 1, 'Double AC room with modern amenities'),
('201', 'single', 3000, 'available', 2, 'Single AC room with modern amenities'),
('202', 'double', 4500, 'available', 2, 'Double AC room with modern amenities'),
('203', 'single', 2000, 'available', 2, 'Single Non-AC room with modern amenities'),
('204', 'double', 3500, 'available', 2, 'Double Non-AC room with modern amenities'),
('205', 'single', 3000, 'available', 2, 'Single AC room with modern amenities'),
('206', 'double', 4500, 'available', 2, 'Double AC room with modern amenities'),
('207', 'single', 2000, 'available', 2, 'Single Non-AC room with modern amenities');

-- Verify setup
SELECT 'Setup complete!' as message, COUNT(*) as total_rooms FROM public.rooms;
