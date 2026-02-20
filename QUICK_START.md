# Quick Start Guide

## 🚀 Setup in 5 Minutes

### 1. Supabase Setup (One-time)

Open **Supabase Dashboard → SQL Editor**

**Run this query:**

```sql
-- Initialize rooms
INSERT INTO public.rooms (room_number, type, price, status, floor, description) VALUES
('101', 'single', 3000, 'occupied', 1, 'Single AC room'),
('102', 'single', 2000, 'available', 1, 'Single Non-AC room'),
('103', 'double', 4500, 'available', 1, 'Double AC room'),
('104', 'double', 3500, 'available', 1, 'Double Non-AC room'),
('105', 'single', 3000, 'available', 1, 'Single AC room'),
('106', 'single', 2000, 'available', 1, 'Single Non-AC room'),
('107', 'double', 4500, 'available', 1, 'Double AC room'),
('108', 'double', 3500, 'available', 1, 'Double Non-AC room'),
('109', 'single', 3000, 'available', 1, 'Single AC room'),
('110', 'double', 4500, 'occupied', 1, 'Double AC room'),
('201', 'single', 3000, 'available', 2, 'Single AC room'),
('202', 'double', 4500, 'available', 2, 'Double AC room'),
('203', 'single', 2000, 'available', 2, 'Single Non-AC room'),
('204', 'double', 3500, 'available', 2, 'Double Non-AC room'),
('205', 'single', 3000, 'available', 2, 'Single AC room'),
('206', 'double', 4500, 'available', 2, 'Double AC room'),
('207', 'single', 2000, 'available', 2, 'Single Non-AC room')
ON CONFLICT DO NOTHING;
```

### 2. Create Users

**Supabase Dashboard → Authentication → Users → Add User**

**Admin:**
- Email: `admin@gmail.com`
- Password: `admin123`
- ✅ Auto Confirm User

**Receptionist:**
- Email: `receptionist@gmail.com`
- Password: `rec123`
- ✅ Auto Confirm User

### 3. Assign Roles

**SQL Editor → Run:**

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'receptionist'::app_role FROM auth.users WHERE email = 'receptionist@gmail.com'
ON CONFLICT DO NOTHING;
```

### 4. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 5. Login

**Admin:** admin@gmail.com / admin123
**Receptionist:** receptionist@gmail.com / rec123

---

## 📦 Deploy to Vercel

1. Push to GitHub
2. Import on Vercel
3. Add env vars from `.env`
4. Deploy

**Cost: ₹0/year**

---

## 📚 Full Documentation

- **Detailed Setup:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
