# Krishna Hotel Management System

Full-stack hotel management Progressive Web App (PWA) with React, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**First time setup?** → See [QUICK_START.md](./QUICK_START.md)

## ✨ New Features

### 📱 Progressive Web App (PWA)
- **Installable**: Install on any device (mobile, tablet, desktop)
- **Offline Support**: Works without internet connection
- **Native Experience**: Looks and feels like a native app
- **Auto Install Prompt**: Smart install prompt appears after 3 seconds
- **Fast Loading**: Cached resources for instant loading

### 🎨 Branding
- Rebranded to "Krishna Hotel"
- Custom favicon support
- Professional theme colors (Blue #1e40af)

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
- **Favicon Guide:** [FAVICON_GUIDE.md](./FAVICON_GUIDE.md) - Custom logo & favicon setup

## 📱 Installing as PWA

### On Mobile (Android/iOS)
1. Open the website in your browser
2. Wait for the install prompt (appears after 3 seconds)
3. Click "Install Now"
4. App will be added to your home screen

### On Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install Krishna Hotel"
3. App opens in its own window

### Manual Installation
- **Chrome/Edge**: Menu → Install Krishna Hotel
- **Safari (iOS)**: Share → Add to Home Screen
- **Firefox**: Not supported yet

## 🎨 Customizing Favicon

See [FAVICON_GUIDE.md](./FAVICON_GUIDE.md) for detailed instructions on:
- Generating custom favicons
- Recommended design tools
- Color schemes and symbols
- File naming conventions

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
