# Deployment Guide

## Backend Removed ✅

The Express backend has been removed. All operations now use Supabase directly from the frontend.

## Supabase Setup (REQUIRED)

**📖 See detailed instructions in `SUPABASE_SETUP.md`**

Quick summary:

### 1. Initialize Database
Run migration in Supabase SQL Editor to create 17 rooms

### 2. Create Users
- Admin: admin@gmail.com / admin123
- Receptionist: receptionist@gmail.com / rec123

### 3. Assign Roles
Run SQL to assign admin and receptionist roles

**Full step-by-step guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Remove backend, use Supabase only"
git push
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 3. Add Environment Variables

In Vercel dashboard, add:

```
VITE_SUPABASE_PROJECT_ID=grpevmdyolrwnjsepjzx
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_URL=https://grpevmdyolrwnjsepjzx.supabase.co
```

### 4. Deploy

Click "Deploy" and wait 2-3 minutes.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Cost

- Frontend (Vercel): ₹0/year
- Database (Supabase): ₹0/year (free for 20+ years at 7000 bookings/year)
- Backend: ₹0/year (removed!)

**Total: ₹0/year**

## What Changed

### Removed:
- `server/` folder (Express backend)
- Backend API calls
- Cold starts
- Server hosting costs

### Added:
- Direct Supabase queries from frontend
- Real-time capabilities (optional)
- Better security with RLS
- Zero hosting cost

## Troubleshooting

### "No rooms found"
Run the initialization migration in Supabase SQL Editor.

### "Permission denied"
Check RLS policies are enabled and user has correct role.

### "Auth error"
Verify environment variables in Vercel dashboard.
