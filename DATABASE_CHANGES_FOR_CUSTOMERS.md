# Database Changes for Customers Page

## ✅ Current Database Structure (Already Exists)

The `customers` table already exists in your database with the following structure:

```sql
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
```

## ✅ Required Relationships (Already Exist)

1. **bookings table** - Already has `customer_id` foreign key:
   ```sql
   customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL
   ```

2. **invoices table** - Already has `booking_id` foreign key:
   ```sql
   booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL
   ```

## ❌ NO DATABASE CHANGES NEEDED!

Your database structure is already perfect for the Customers page functionality. The query used in the API:

```sql
SELECT 
  c.id,
  c.name,
  c.mobile as phone,
  c.email,
  COUNT(b.id) as totalStays,
  SUM(i.total) as totalRevenue,
  MAX(b.check_out) as lastStay
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN invoices i ON b.id = i.booking_id
GROUP BY c.id
ORDER BY c.created_at DESC
```

This query works with your existing database structure!

## 📝 What Was Added

### 1. **API Functions** (src/services/api.ts)
- `customersApi.getAll(searchQuery?)` - Get all customers with stats
- `customersApi.getById(id)` - Get customer details with booking history

### 2. **New Page** (src/pages/Customers.tsx)
- Customer list with search functionality
- Customer statistics (Total Customers, Total Bookings, Total Revenue)
- Detailed customer view modal with:
  - Customer information
  - Statistics (Total Stays, Total Revenue, Last Stay)
  - Complete booking history
  - Quick action to create new booking

## 🎯 Features Implemented

1. **Search Functionality**: Search by name, phone, or email
2. **Customer Table**: Shows all customer data in organized table
3. **Customer Details Modal**: Click "View" to see:
   - Full customer information
   - Statistics cards
   - Complete booking history with status badges
   - "New Booking" button to create booking for this customer
4. **Statistics Dashboard**: Shows aggregate data for all customers

## 🚀 Next Steps

1. Add the Customers page to your navigation/routing
2. Test the page with existing customer data
3. The page will automatically populate as you create new bookings

## ✨ No SQL Changes Required!

Your database is already set up correctly. Just add the Customers page to your app routing and you're good to go!
