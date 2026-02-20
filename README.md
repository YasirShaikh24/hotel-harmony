# Hotel Management System

Full-stack hotel management application with React, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**First time setup?** → See [QUICK_START.md](./QUICK_START.md)

## 📋 Features

- Room Management (17 rooms: 101-110, 201-207)
- Booking System with Check-in/Check-out
- Invoice Generation & Management
- Financial Tracking (Income & Expenses)
- Reports & Analytics
- Role-based Access (Admin & Receptionist)

## 🔐 Default Login Credentials

**Admin:**
- Email: `admin@gmail.com`
- Password: `admin123`

**Receptionist:**
- Email: `receptionist@gmail.com`
- Password: `rec123`

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel (Frontend) + Supabase (Database)

## 💰 Cost

**₹0/year** - Completely free!

- Vercel Free Tier: Unlimited
- Supabase Free Tier: 500MB DB, 50K users (lasts 20+ years at 7000 bookings/year)

## 📚 Documentation

- **Quick Setup:** [QUICK_START.md](./QUICK_START.md) - 5 minute setup
- **Supabase Setup:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed database setup
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production

## 🛠️ Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Supabase (PostgreSQL + Auth)
- React Query (TanStack Query)
- React Router
- Recharts (Analytics)
- jsPDF (Invoice generation)

## 📦 Project Structure

```
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Page components
│   ├── services/       # API services (Supabase)
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── integrations/   # Supabase client
├── supabase/
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin, Receptionist, Customer)
- Secure authentication with Supabase Auth
- Environment variables for sensitive data

## 📝 License

MIT

## 🤝 Support

For issues or questions, check the documentation files or create an issue.
