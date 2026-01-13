export type UserRole = 'admin' | 'receptionist' | 'customer';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export type RoomType = 'single' | 'double' | 'deluxe' | 'suite' | 'presidential';

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Room {
  id: string;
  room_number: string;
  type: RoomType;
  price: number;
  status: RoomStatus;
  floor: number;
  amenities: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  mobile: string;
  email?: string;
  aadhar_encrypted?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  room_id?: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  adults: number;
  children?: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  room?: Room;
}

export interface Invoice {
  id: string;
  booking_id: string;
  room_charges: number;
  additional_charges?: number;
  cgst: number;
  sgst: number;
  total: number;
  payment_status: string;
  payment_method?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

export interface Income {
  id: string;
  invoice_id?: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppLog {
  id: string;
  mobile: string;
  invoice_id?: string;
  status: string;
  message?: string;
  sent_at?: string;
  created_at: string;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyIncome: number;
  yearlyIncome: number;
  totalExpenses: number;
  netProfit: number;
  occupancyRate: number;
}
