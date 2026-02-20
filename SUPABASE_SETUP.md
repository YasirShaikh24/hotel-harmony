# Supabase Setup Guide

## Step 1: Initialize Database (Run Migrations)

Go to **Supabase Dashboard → SQL Editor → New Query**

### Migration 1: Initialize Rooms Data

```sql
-- Initialize rooms data (101-110, 201-207)
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
('207', 'single', 2000, 'available', 2, 'Single Non-AC room with modern amenities')
ON CONFLICT (room_number) DO NOTHING;

-- Add sample income data
INSERT INTO public.income (amount, description, date) VALUES
(15000, 'Room 101 booking payment', CURRENT_DATE),
(2500, 'Restaurant services', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT DO NOTHING;
```

Click **Run** ✅

---

## Step 2: Create Admin and Receptionist Users

### A. Create Admin User

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - **Email:** `admin@gmail.com`
   - **Password:** `admin123`
   - **Auto Confirm User:** ✅ **CHECK THIS BOX** (important!)
4. Click **"Create user"**
5. **Copy the User ID** (you'll need it in next step)

### B. Create Receptionist User

1. Click **"Add User"** → **"Create new user"** again
2. Fill in:
   - **Email:** `receptionist@gmail.com`
   - **Password:** `rec123`
   - **Auto Confirm User:** ✅ **CHECK THIS BOX** (important!)
3. Click **"Create user"**
4. **Copy the User ID** (you'll need it in next step)

---

## Step 3: Assign Roles to Users

Go back to **SQL Editor → New Query**

### Option A: Automatic (Recommended)

```sql
-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign receptionist role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'receptionist'::app_role 
FROM auth.users 
WHERE email = 'receptionist@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Click **Run** ✅

### Option B: Manual (if Option A doesn't work)

First, find the user IDs:

```sql
SELECT id, email FROM auth.users 
WHERE email IN ('admin@gmail.com', 'receptionist@gmail.com');
```

Then replace the UUIDs below with the actual IDs and run:

```sql
-- Replace ADMIN_USER_ID_HERE with actual admin user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('ADMIN_USER_ID_HERE', 'admin');

-- Replace RECEPTIONIST_USER_ID_HERE with actual receptionist user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('RECEPTIONIST_USER_ID_HERE', 'receptionist');
```

---

## Step 4: Verify Setup

Run this query to verify roles are assigned:

```sql
SELECT 
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('admin@gmail.com', 'receptionist@gmail.com');
```

You should see:

| email | role |
|-------|------|
| admin@gmail.com | admin |
| receptionist@gmail.com | receptionist |

---

## Step 5: Test Login

### Admin Login:
- Email: `admin@gmail.com`
- Password: `admin123`
- Should have access to: All features (Dashboard, Rooms, Bookings, Billing, Expenses, Reports)

### Receptionist Login:
- Email: `receptionist@gmail.com`
- Password: `rec123`
- Should have access to: Dashboard, Rooms, Bookings, Billing (limited features)

---

## Troubleshooting

### "Email not confirmed"
Make sure you checked **"Auto Confirm User"** when creating users.

### "Permission denied"
Run the role assignment queries again (Step 3).

### "User not found"
Verify users exist in Authentication → Users section.

### "Invalid login credentials"
Double-check email and password are exactly:
- Admin: `admin@gmail.com` / `admin123`
- Receptionist: `receptionist@gmail.com` / `rec123`

---

## Summary

✅ Database initialized with 17 rooms
✅ Admin user created: admin@gmail.com
✅ Receptionist user created: receptionist@gmail.com
✅ Roles assigned correctly

**You're ready to use the app!**
