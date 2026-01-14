# Hotel Management System

A comprehensive hotel management system built with React (Frontend) and Node.js (Backend).

## 🚀 Quick Start

### Option 1: Single Command (Recommended)
```bash
npm start
```

### Option 2: With Colored Output
```bash
npm run start:dev
```

### Option 3: Using Batch File (Windows)
```bash
start.bat
```

### Option 4: Using Shell Script (Mac/Linux)
```bash
chmod +x start.sh
./start.sh
```

## 📋 What happens when you run the start command:
- ✅ Backend server starts on `http://localhost:5000`
- ✅ Frontend development server starts on `http://localhost:5173` (or next available port)
- ✅ Both servers run simultaneously
- ✅ Hot reload enabled for development

## 🔑 Login Credentials

- **Admin**: `admin@hotel.com` / `admin123`
- **Receptionist**: `receptionist@hotel.com` / `receptionist123`
- **Customer**: `customer@hotel.com` / `customer123`

## 🛠 Manual Setup (if needed)

### Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Run Servers Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

## 🏨 Features

- **Room Management**: Manage rooms 101-117 with different types (Single/Double, AC/Non-AC)
- **Booking System**: Complete booking management with check-in/check-out and editable total amounts
- **Billing & Invoices**: Generate PDFs and share via WhatsApp
- **Financial Management**: Track income and expenses with time-based filtering
- **Role-based Access**: Admin, Receptionist, and Customer roles

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: In-memory storage (for development)
- **State Management**: TanStack Query (React Query)

## 📱 Access Your Application

Once started, open your browser and navigate to the frontend URL shown in the terminal (usually `http://localhost:5173`).

## 🛑 Stop the Application

Press `Ctrl+C` in the terminal to stop both servers.

---

## 🏨 **Detailed Features**

### 🛏️ **Room Management** (Admin/Receptionist)
- **18 Rooms** (101-118) with AC/Non-AC options
- **Room Types**: Single AC, Single Non-AC, Double AC, Double Non-AC
- **Pricing**: Automatic pricing based on room type
- **Edit Room Details**: Type, price, status, description
- **Room Status**: Available, Occupied, Maintenance, Cleaning
- **Real-time Updates** via backend API

### 📅 **Booking Management** (All Roles)
- **Aadhar Card Validation**: Exactly 12 digits required
- **Automatic Pricing**: Based on room type and stay duration
- **Filter Options**:
  - All Bookings
  - Check-in Ready
  - Check-out Ready
- **Add New Bookings** with customer details and Aadhar
- **Customer View**: Only their own bookings
- **Staff View**: All bookings with management options
- **Automatic Invoice Generation**: Creates invoice when booking is made

### 💰 **Billing & Invoices** (All Roles)
- **Automatic Invoice Creation**: Generated from bookings
- **Pricing Calculation**: Room rate × days + 18% tax (9% CGST + 9% SGST)
- **Filter by Status**: Pending, Paid
- **Invoice Actions**:
  - View Invoice Details
  - Download PDF
  - **Share via WhatsApp** (direct mobile link)
- **Payment Status Management**

### 💸 **Financial Management** (Admin Only)
- **Income Tracking**: Add and manage income sources
- **Expense Management**: Category, amount, description, date
- **Time-based Filtering**: Daily, Monthly, Yearly views
- **Financial Summary**: Total income, expenses, net profit
- **Delete Records**: Remove income/expense records

Built with ❤️ for efficient hotel management.

## Features

### 🏨 **Dashboard**
- **Admin/Receptionist/Customer** role-based access
- Real-time room statistics (Total, Available, Occupied)
- Today's check-ins and check-outs
- Clean, modern interface

### 🛏️ **Room Management** (Admin/Receptionist)
- **18 Rooms** (101-118) with AC/Non-AC options
- **Room Types**: Single AC, Single Non-AC, Double AC, Double Non-AC
- **Pricing**: Automatic pricing based on room type
- **Edit Room Details**: Type, price, status, description
- **Room Status**: Available, Occupied, Maintenance, Cleaning
- **Real-time Updates** via backend API

### 📅 **Booking Management** (All Roles)
- **Aadhar Card Validation**: Exactly 12 digits required
- **Automatic Pricing**: Based on room type and stay duration
- **Filter Options**:
  - All Bookings
  - Check-in Ready
  - Check-out Ready
- **Add New Bookings** with customer details and Aadhar
- **Customer View**: Only their own bookings
- **Staff View**: All bookings with management options
- **Automatic Invoice Generation**: Creates invoice when booking is made

### 💰 **Billing & Invoices** (All Roles)
- **Automatic Invoice Creation**: Generated from bookings
- **Pricing Calculation**: Room rate × days + 18% tax (9% CGST + 9% SGST)
- **Filter by Status**: Pending, Paid
- **Invoice Actions**:
  - View Invoice Details
  - Download PDF
  - **Share via WhatsApp** (direct mobile link)
- **Payment Status Management**

### 💸 **Expenses Management** (Admin Only)
- **Add Expenses**: Category, amount, description, date
- **Expense Tracking**: Total expenses, monthly expenses
- **Delete Expenses**: Remove expense records
- **Expense Categories**: Maintenance, utilities, staff, etc.

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hotel-management-system
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Install Backend Dependencies**
```bash
cd server
npm install
```

4. **Start the Backend Server**
```bash
cd server
npm start
```
Backend runs on: http://localhost:5000

5. **Start the Frontend Development Server**
```bash
npm run dev
```
Frontend runs on: http://localhost:8081

## 🔐 **Demo Login Credentials**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gmail.com | admin123 |
| **Receptionist** | receptionist@gmail.com | rec123 |
| **Customer** | customer@gmail.com | customer123 |

## 📱 **Role-Based Features**

### 👑 **Admin Access**
- Full dashboard with room statistics
- Room management (view, edit)
- All bookings management
- Invoice management
- **Expenses management**
- Reports and analytics

### 🏨 **Receptionist Access**
- Basic dashboard with room stats
- Room management (view, edit)
- Booking management with check-in/out
- Invoice management
- Limited to operational tasks

### 👤 **Customer Access**
- Personal dashboard
- View own bookings only
- View own invoices only
- Limited to personal data

## 🛠️ **Technical Stack**

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Query** for data fetching
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **In-memory data storage** (no database)
- **CORS enabled** for frontend communication
- **RESTful API** design
- **UUID** for unique IDs

## 📊 **API Endpoints**

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Rooms
- `GET /api/rooms` - Get all rooms (101-118)
- `GET /api/rooms/:id` - Get room by ID
- `PUT /api/rooms/:id` - Update room

### Bookings
- `GET /api/bookings` - Get bookings (with status filter)
- `POST /api/bookings` - Create new booking (auto-generates invoice)
- `PUT /api/bookings/:id` - Update booking

### Invoices
- `GET /api/invoices` - Get invoices (with status filter)
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/pdf` - Generate PDF
- `GET /api/invoices/:id/download` - Download PDF
- `POST /api/invoices/:id/share` - Generate WhatsApp link

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## 🎯 **Key Features Implemented**

✅ **Rooms 101-118** - AC/Non-AC Single/Double rooms  
✅ **Automatic Pricing** - Based on room type and duration  
✅ **Aadhar Validation** - Exactly 12 digits required  
✅ **Auto Invoice Generation** - From bookings  
✅ **WhatsApp Integration** - Direct invoice sharing  
✅ **Expense Management** - Complete expense tracking  
✅ **Role-Based Access** - Admin/Receptionist/Customer  
✅ **Real-time Updates** - React Query with backend sync  
✅ **No Database Required** - All data in memory  

## 🏨 **Room Configuration**

**Room Numbers**: 101-118 (18 total rooms)
**Room Types & Pricing**:
- Single AC: ₹3,000/night
- Single Non-AC: ₹2,000/night  
- Double AC: ₹4,500/night
- Double Non-AC: ₹3,500/night

**Tax Calculation**: 18% total (9% CGST + 9% SGST)

## 📱 **WhatsApp Integration**
The WhatsApp share feature generates direct links like:
```
https://wa.me/+919876543210?text=Your invoice INV-001 is ready. Total amount: ₹20,650
```

## 🔄 **Data Flow**
1. **Booking Created** → Room pricing calculated → Invoice auto-generated
2. **Invoice Generated** → Available for download/WhatsApp sharing
3. **Expenses Added** → Tracked in expenses management
4. **All Changes** → Real-time sync between frontend and backend

## 🎨 **UI/UX Features**
- **Responsive Design** - Works on desktop, tablet, mobile
- **Role-Based Navigation** - Different menus for each role
- **Modern Components** - Cards, modals, forms, validation
- **Professional Styling** - Gradient themes, shadows, animations
- **Loading States** - User-friendly loading indicators
- **Error Handling** - Comprehensive error management

**Your complete hotel management system is ready with all requested features!** 🎉