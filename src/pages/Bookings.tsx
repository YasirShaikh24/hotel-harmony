import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarCheck, Users, Phone, Mail, Plus, Eye, Edit, LogIn, LogOut, CalendarIcon, Search, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, roomsApi, invoicesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// ─── localStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEYS = {
  ADD_FORM: 'booking_add_form_draft',
  ADD_ROOM_PRICE: 'booking_add_room_price',
  ADD_ROOM_TYPE: 'booking_add_room_type',
  EDIT_FORM: (id: string) => `booking_edit_form_draft_${id}`,
  EDIT_ROOM_TYPE: (id: string) => `booking_edit_room_type_${id}`,
};

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (_) {
    return fallback;
  }
}

function clearStorage(...keys: string[]) {
  keys.forEach((k) => {
    try { localStorage.removeItem(k); } catch (_) {}
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string; // Made optional
  customerPhone: string;
  documentName?: string;
  documentNumber?: string;
  customDocumentName?: string;
  customer2Name?: string;
  customerGstNumber?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string; // New field for check-in time
  checkOutTime?: string; // New field for check-out time
  status: string;
  adults: number;
  children: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaymentMethod?: string;
  specialRequests?: string;
  createdAt?: string;
  // Payment status fields
  paymentStatus?: string;
  totalPaid?: number;
  balanceDue?: number;
}

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  price: number;
  status: string;
}

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ViewBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

interface EditBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

function AddBookingModal({ isOpen, onClose }: AddBookingModalProps) {
  const initialFormData = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    documentName: '',
    documentNumber: '',
    customDocumentName: '',
    customer2Name: '',
    customerGstNumber: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    checkInTime: '2:00 PM', // Default check-in time in AM/PM format
    checkOutTime: '11:00 AM', // Default check-out time in AM/PM format
    adults: 1,
    children: 0,
    totalAmount: 0,
    advanceAmount: 0,
    advancePaymentMethod: '',
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [roomAvailabilityError, setRoomAvailabilityError] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Reset form when modal opens to ensure advance amount is always 0
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedRoomPrice(0);
      setSelectedRoomType('');
      setRoomAvailabilityError('');
    }
  }, [isOpen]);

  // Persist every form change automatically
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ADD_FORM, formData);
  }, [formData]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ADD_ROOM_PRICE, selectedRoomPrice);
  }, [selectedRoomPrice]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ADD_ROOM_TYPE, selectedRoomType);
  }, [selectedRoomType]);

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const { data: existingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll(),
  });

  // Check room availability for selected dates
  const checkRoomAvailability = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut || !existingBookings) {
      setRoomAvailabilityError('');
      return;
    }

    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    // Find rooms that are booked during the selected dates
    const bookedRooms = existingBookings
      .filter((booking: any) => booking.status !== 'cancelled' && booking.status !== 'checked_out')
      .filter((booking: any) => {
        const existingCheckIn = new Date(booking.checkIn);
        const existingCheckOut = new Date(booking.checkOut);
        return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
      })
      .map((booking: any) => booking.roomNumber);

    const availableRooms = rooms?.filter((room: any) => !bookedRooms.includes(room.roomNumber)) || [];

    if (availableRooms.length === 0) {
      setRoomAvailabilityError('No rooms available for the selected dates. Please try different dates.');
    } else if (bookedRooms.length > 0) {
      setRoomAvailabilityError(`${bookedRooms.length} room(s) already booked for these dates. ${availableRooms.length} room(s) still available.`);
    } else {
      setRoomAvailabilityError('');
    }
  };

  const addBookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Also refresh invoices
      
      // Trigger cross-component refresh
      localStorage.setItem('booking-created', Date.now().toString());
      window.dispatchEvent(new CustomEvent('booking-created'));
      
      // Clear draft on successful submit
      clearStorage(
        STORAGE_KEYS.ADD_FORM,
        STORAGE_KEYS.ADD_ROOM_PRICE,
        STORAGE_KEYS.ADD_ROOM_TYPE
      );
      setFormData(initialFormData);
      setSelectedRoomPrice(0);
      setSelectedRoomType('');
      toast({ title: 'Success', description: 'Booking created successfully' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create booking',
        variant: 'destructive',
      });
    },
  });

  const handleRoomChange = (roomNumber: string) => {
    const room = rooms?.find((r: Room) => r.roomNumber === roomNumber);
    if (room) {
      setSelectedRoomPrice(room.price);
      setSelectedRoomType(room.type);
      const updated = { ...formData, roomNumber };
      setFormData(updated);
      
      // Recalculate total if dates are already selected
      if (formData.checkIn && formData.checkOut) {
        const days = Math.ceil(
          (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        setFormData({ ...updated, totalAmount: room.price * Math.max(1, days) });
      }
    }
  };

  const handleDateChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    // Check room availability when both dates are selected
    const checkIn = field === 'checkIn' ? value : formData.checkIn;
    const checkOut = field === 'checkOut' ? value : formData.checkOut;
    
    if (checkIn && checkOut) {
      checkRoomAvailability(checkIn, checkOut);
      
      // Recalculate total amount if room is selected
      if (selectedRoomPrice > 0) {
        const days = Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        setFormData({ ...updated, totalAmount: selectedRoomPrice * Math.max(1, days) });
      }
    }
  };

  const handleClose = () => {
    // Draft is already saved — just close without wiping
    onClose();
  };

  const handleClearDraft = () => {
    clearStorage(
      STORAGE_KEYS.ADD_FORM,
      STORAGE_KEYS.ADD_ROOM_PRICE,
      STORAGE_KEYS.ADD_ROOM_TYPE
    );
    setFormData(initialFormData);
    setSelectedRoomPrice(0);
    setSelectedRoomType('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (formData.checkIn === formData.checkOut) {
      toast({ 
        title: 'Invalid Dates', 
        description: 'Check-out date must be at least 1 day after check-in date', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (formData.customerPhone.length !== 10) {
      toast({ title: 'Invalid Mobile Number', description: 'Mobile number must be exactly 10 digits', variant: 'destructive' });
      return;
    }
    if (formData.documentName && !formData.documentNumber) {
      toast({ title: 'Document Number Required', description: 'Please enter document number for the selected document type', variant: 'destructive' });
      return;
    }
    if (formData.documentName === 'Other' && !formData.customDocumentName) {
      toast({ title: 'Custom Document Name Required', description: 'Please enter the document name when "Other" is selected', variant: 'destructive' });
      return;
    }

    if (formData.advanceAmount > formData.totalAmount) {
      toast({
        title: 'Invalid Advance Amount',
        description: 'Advance amount cannot be more than total amount',
        variant: 'destructive',
      });
      return;
    }
    if (formData.advanceAmount > 0 && !formData.advancePaymentMethod) {
      toast({ title: 'Payment Method Required', description: 'Please select a payment method for the advance payment', variant: 'destructive' });
      return;
    }
    addBookingMutation.mutate(formData);
  };

  const hasDraft = formData.customerName || formData.roomNumber || formData.checkIn;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Booking</DialogTitle>
            {hasDraft && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  📝 Draft saved
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={handleClearDraft}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room</Label>
            <select
              id="roomNumber"
              value={formData.roomNumber}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="room-select"
              required
            >
              <option value="">Select room</option>
              {rooms?.filter((room: Room) => room.status === 'available').map((room: Room) => (
                <option key={room.id} value={room.roomNumber}>
                  Room {room.roomNumber} - {room.type} (₹{room.price.toLocaleString()}/day)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
          </div>

          {selectedRoomType && selectedRoomType.toLowerCase().includes('double') && (
            <div className="space-y-2">
              <Label htmlFor="customer2Name">Customer 2 Name (Optional)</Label>
              <Input
                id="customer2Name"
                value={formData.customer2Name}
                onChange={(e) => setFormData({ ...formData, customer2Name: e.target.value })}
                placeholder="Enter second customer name (if applicable)"
              />
              <p className="text-xs text-muted-foreground">
                Add second customer name for double occupancy. Useful if one customer leaves early.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="Enter email address (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) setFormData({ ...formData, customerPhone: value });
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />
              {formData.customerPhone && formData.customerPhone.length !== 10 && (
                <p className="text-sm text-red-600">Mobile number must be exactly 10 digits</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <select
                id="documentName"
                value={formData.documentName}
                onChange={(e) => {
                  setFormData({ ...formData, documentName: e.target.value });
                  // Clear custom document name if not "Other"
                  if (e.target.value !== 'Other') {
                    setFormData(prev => ({ ...prev, documentName: e.target.value, customDocumentName: '' }));
                  }
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select document type</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Other">Other</option>
              </select>
              {formData.documentName === 'Other' && (
                <Input
                  placeholder="Enter custom document name"
                  value={formData.customDocumentName}
                  onChange={(e) => setFormData({ ...formData, customDocumentName: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="Enter document number"
                required={!!formData.documentName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerGstNumber">GST Number (Optional)</Label>
            <Input
              id="customerGstNumber"
              value={formData.customerGstNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 15) setFormData({ ...formData, customerGstNumber: value });
              }}
              placeholder="Enter 15-character GST number (if applicable)"
              maxLength={15}
            />
            {formData.customerGstNumber && formData.customerGstNumber.length > 0 && formData.customerGstNumber.length !== 15 && (
              <p className="text-sm text-yellow-600">GST number should be 15 characters</p>
            )}
            <p className="text-xs text-muted-foreground">For business travelers who need GST invoice</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                min={today}
                value={formData.checkIn}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                min={formData.checkIn ? 
                  new Date(new Date(formData.checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                  : new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
                value={formData.checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Room Availability Alert */}
          {roomAvailabilityError && (
            <div className={`p-3 rounded-lg border ${
              roomAvailabilityError.includes('No rooms available') 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {roomAvailabilityError.includes('No rooms available') ? '❌' : '⚠️'}
                </span>
                <span className="text-sm font-medium">{roomAvailabilityError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <TimePicker
                id="checkInTime"
                value={formData.checkInTime}
                onChange={(time) => setFormData({ ...formData, checkInTime: time })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Check-out Time</Label>
              <TimePicker
                id="checkOutTime"
                value={formData.checkOutTime}
                onChange={(time) => setFormData({ ...formData, checkOutTime: time })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addTotalAmount">Total Amount (₹)</Label>
            <Input
              id="addTotalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount || ''}
              onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter total amount"
              required
            />
          </div>

          {formData.totalAmount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Room Amount:</span>
                <span className="font-medium">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="advanceAmount">Advance Payment (₹)</Label>
            <Input
              id="advanceAmount"
              type="number"
              min="0"
              max={formData.totalAmount}
              step="0.01"
              value={formData.advanceAmount || ''}
              onChange={(e) => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter advance payment amount"
            />
            {formData.totalAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Maximum: ₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {formData.advanceAmount > 0 && (
            <div className="space-y-2">
              <Label>Advance Payment Method</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="advancePaymentMethod"
                    value="gpay"
                    checked={formData.advancePaymentMethod === 'gpay'}
                    onChange={(e) => setFormData({ ...formData, advancePaymentMethod: e.target.value })}
                    required={formData.advanceAmount > 0}
                  />
                  <span>GPay</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="advancePaymentMethod"
                    value="cash"
                    checked={formData.advancePaymentMethod === 'cash'}
                    onChange={(e) => setFormData({ ...formData, advancePaymentMethod: e.target.value })}
                    required={formData.advanceAmount > 0}
                  />
                  <span>Cash</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="advancePaymentMethod"
                    value="mim"
                    checked={formData.advancePaymentMethod === 'mim'}
                    onChange={(e) => setFormData({ ...formData, advancePaymentMethod: e.target.value })}
                    required={formData.advanceAmount > 0}
                  />
                  <span>MIM</span>
                </label>
              </div>
            </div>
          )}

          {formData.totalAmount > 0 && formData.advanceAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-medium">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Advance Paid:</span>
                <span className="font-medium text-green-600">-₹{formData.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Due Amount:</span>
                <span className="text-orange-600">₹{(formData.totalAmount - formData.advanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={addBookingMutation.isPending} className="flex-1">
              {addBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ViewBookingModal (unchanged) ────────────────────────────────────────────

function ViewBookingModal({ booking, isOpen, onClose }: ViewBookingModalProps) {
  if (!booking) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Customer Information</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {booking.customerName}</p>
              {booking.customer2Name && (
                <p><strong>Customer 2:</strong> {booking.customer2Name}</p>
              )}
              {booking.customerEmail && (
                <p><strong>Email:</strong> {booking.customerEmail}</p>
              )}
              <p><strong>Phone:</strong> {booking.customerPhone}</p>
              {booking.documentName && (
                <p><strong>{booking.documentName === 'Other' ? booking.customDocumentName : booking.documentName}:</strong> {booking.documentNumber}</p>
              )}
              {booking.customerGstNumber && (
                <p><strong>GST No:</strong> <span className="font-mono text-xs">{booking.customerGstNumber}</span></p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Room Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Room:</strong> {booking.roomNumber} - {booking.roomType}</p>
              <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}{booking.checkInTime && ` at ${booking.checkInTime}`}</p>
              <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}{booking.checkOutTime && ` at ${booking.checkOutTime}`}</p>
              <p><strong>Guests:</strong> {booking.adults} Adults, {booking.children} Children</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Billing Details</h4>
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">₹{booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {booking.advanceAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Advance Paid:</span>
                    <span className="font-medium text-green-600">-₹{booking.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Advance Method:</span>
                    <span className="font-medium capitalize">{booking.advancePaymentMethod}</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-bold text-orange-600">
                    <span>Due Amount:</span>
                    <span>₹{(booking.totalAmount - booking.advanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBookingModal({ booking, isOpen, onClose }: EditBookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    documentName: '',
    documentNumber: '',
    customDocumentName: '',
    customer2Name: '',
    customerGstNumber: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
    adults: 1,
    children: 0,
    totalAmount: 0,
    status: 'confirmed',
  });
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '12:00 PM';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const minute = minutes || '00';
    
    if (hour === 0) return `12:${minute} AM`;
    if (hour < 12) return `${hour}:${minute} AM`;
    if (hour === 12) return `12:${minute} PM`;
    return `${hour - 12}:${minute} PM`;
  };

  // Helper function to convert 12-hour AM/PM format to 24-hour format for input
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return '12:00';
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to handle time input change
  const handleTimeChange = (field: string, value: string) => {
    const time12 = convertTo12Hour(value);
    setFormData({ ...formData, [field]: time12 });
  };

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  // When booking changes, check for a persisted draft first, else load booking data
  useEffect(() => {
    if (booking) {
      setFormData({
        customerName: booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        documentName: booking.documentName || '',
        documentNumber: booking.documentNumber || '',
        customDocumentName: booking.customDocumentName || '',
        customer2Name: booking.customer2Name || '',
        customerGstNumber: booking.customerGstNumber || '',
        roomNumber: booking.roomNumber || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        checkInTime: booking.checkInTime || '2:00 PM',
        checkOutTime: booking.checkOutTime || '11:00 AM',
        adults: booking.adults || 1,
        children: booking.children || 0,
        totalAmount: booking.totalAmount || 0,
        status: booking.status || 'confirmed',
      });
      setSelectedRoomType(booking.roomType || '');
    }
  }, [booking]);

  // Persist every change
  useEffect(() => {
    if (booking && isOpen) {
      saveToStorage(STORAGE_KEYS.EDIT_FORM(booking.id), formData);
    }
  }, [formData, booking, isOpen]);

  useEffect(() => {
    if (booking && isOpen) {
      saveToStorage(STORAGE_KEYS.EDIT_ROOM_TYPE(booking.id), selectedRoomType);
    }
  }, [selectedRoomType, booking, isOpen]);

  const handleRoomChange = (roomNumber: string) => {
    const room = rooms?.find((r: Room) => r.roomNumber === roomNumber);
    if (room) {
      setSelectedRoomType(room.type);
      if (formData.checkIn && formData.checkOut) {
        const days = Math.ceil(
          (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        setFormData({ ...formData, roomNumber, totalAmount: room.price * Math.max(1, days) });
      } else {
        setFormData({ ...formData, roomNumber });
      }
    } else {
      setFormData({ ...formData, roomNumber });
    }
  };

  const handleDateChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    if (updated.roomNumber && updated.checkIn && updated.checkOut) {
      const room = rooms?.find((r: Room) => r.roomNumber === updated.roomNumber);
      if (room) {
        const days = Math.ceil(
          (new Date(updated.checkOut).getTime() - new Date(updated.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        updated.totalAmount = room.price * Math.max(1, days);
      }
    }
    setFormData(updated);
  };

  const updateBookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.update(booking!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // Clear draft after successful save
      clearStorage(
        STORAGE_KEYS.EDIT_FORM(booking!.id),
        STORAGE_KEYS.EDIT_ROOM_TYPE(booking!.id)
      );
      setDraftLoaded(false);
      toast({ title: 'Success', description: 'Booking updated successfully' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update booking', variant: 'destructive' });
    },
  });

  const handleDiscardDraft = () => {
    if (!booking) return;
    clearStorage(
      STORAGE_KEYS.EDIT_FORM(booking.id),
      STORAGE_KEYS.EDIT_ROOM_TYPE(booking.id)
    );
    const fresh = {
      customerName: booking.customerName || '',
      customerEmail: booking.customerEmail || '',
      customerPhone: booking.customerPhone || '',
      documentName: booking.documentName || '',
      documentNumber: booking.documentNumber || '',
      customDocumentName: booking.customDocumentName || '',
      customer2Name: booking.customer2Name || '',
      customerGstNumber: booking.customerGstNumber || '',
      roomNumber: booking.roomNumber || '',
      checkIn: booking.checkIn || '',
      checkOut: booking.checkOut || '',
      checkInTime: booking.checkInTime || '2:00 PM',
      checkOutTime: booking.checkOutTime || '11:00 AM',
      adults: booking.adults || 1,
      children: booking.children || 0,
      totalAmount: booking.totalAmount || 0,
      status: booking.status || 'confirmed',
    };
    setFormData(fresh);
    setSelectedRoomType(booking.roomType || '');
    setDraftLoaded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingMutation.mutate(formData);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Booking</DialogTitle>
            {draftLoaded && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  📝 Unsaved draft restored
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={handleDiscardDraft}
                >
                  Discard
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editRoomNumber">Room</Label>
            <select
              id="editRoomNumber"
              value={formData.roomNumber}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="room-select"
              required
            >
              <option value="">Select room</option>
              {rooms
                ?.filter((room: Room) => room.status === 'available' || room.roomNumber === formData.roomNumber)
                .map((room: Room) => (
                  <option key={room.id} value={room.roomNumber}>
                    Room {room.roomNumber} - {room.type} (₹{room.price.toLocaleString()}/day)
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCustomerName">Customer Name</Label>
            <Input id="editCustomerName" value={formData.customerName} readOnly className="bg-muted" />
          </div>

          {selectedRoomType && selectedRoomType.toLowerCase().includes('double') && (
            <div className="space-y-2">
              <Label htmlFor="editCustomer2Name">Customer 2 Name (Optional)</Label>
              <Input
                id="editCustomer2Name"
                value={formData.customer2Name}
                onChange={(e) => setFormData({ ...formData, customer2Name: e.target.value })}
                placeholder="Enter second customer name (if applicable)"
              />
              <p className="text-xs text-muted-foreground">
                Add second customer name for double occupancy. Useful if one customer leaves early.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCustomerEmail">Customer Email (Optional)</Label>
              <Input
                id="editCustomerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="Enter email address (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCustomerPhone">Customer Phone</Label>
              <Input id="editCustomerPhone" value={formData.customerPhone} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editDocumentName">Document Name</Label>
              <select
                id="editDocumentName"
                value={formData.documentName}
                onChange={(e) => {
                  setFormData({ ...formData, documentName: e.target.value });
                  // Clear custom document name if not "Other"
                  if (e.target.value !== 'Other') {
                    setFormData(prev => ({ ...prev, documentName: e.target.value, customDocumentName: '' }));
                  }
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select document type</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Other">Other</option>
              </select>
              {formData.documentName === 'Other' && (
                <Input
                  placeholder="Enter custom document name"
                  value={formData.customDocumentName}
                  onChange={(e) => setFormData({ ...formData, customDocumentName: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDocumentNumber">Document Number</Label>
              <Input
                id="editDocumentNumber"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="Enter document number"
                required={!!formData.documentName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCustomerGstNumber">GST Number (Optional)</Label>
            <Input
              id="editCustomerGstNumber"
              value={formData.customerGstNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 15) setFormData({ ...formData, customerGstNumber: value });
              }}
              placeholder="Enter 15-character GST number (if applicable)"
              maxLength={15}
            />
            {formData.customerGstNumber && formData.customerGstNumber.length > 0 && formData.customerGstNumber.length !== 15 && (
              <p className="text-sm text-yellow-600">GST number should be 15 characters</p>
            )}
            <p className="text-xs text-muted-foreground">For business travelers who need GST invoice</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCheckIn">Check-in Date</Label>
              <Input
                id="editCheckIn"
                type="date"
                min={today}
                value={formData.checkIn}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCheckOut">Check-out Date</Label>
              <Input
                id="editCheckOut"
                type="date"
                min={formData.checkIn ? 
                  new Date(new Date(formData.checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                  : new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
                value={formData.checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCheckInTime">Check-in Time</Label>
              <TimePicker
                id="editCheckInTime"
                value={formData.checkInTime}
                onChange={(time) => setFormData({ ...formData, checkInTime: time })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCheckOutTime">Check-out Time</Label>
              <TimePicker
                id="editCheckOutTime"
                value={formData.checkOutTime}
                onChange={(time) => setFormData({ ...formData, checkOutTime: time })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editAdults">Adults</Label>
              <Input
                id="editAdults"
                type="number"
                min="1"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChildren">Children</Label>
              <Input
                id="editChildren"
                type="number"
                min="0"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTotalAmount">Total Amount (₹)</Label>
            <Input
              id="editTotalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount || ''}
              onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter total amount"
              required
            />
          </div>

          {formData.totalAmount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Room Amount:</span>
                <span className="font-medium">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              {[
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'checked_in', label: 'Checked In' },
                { value: 'checked_out', label: 'Checked Out' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={formData.status === value}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={updateBookingMutation.isPending} className="flex-1">
              {updateBookingMutation.isPending ? 'Updating...' : 'Update Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shift Room Modal ─────────────────────────────────────────────────────────

interface ShiftRoomModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

function ShiftRoomModal({ booking, isOpen, onClose }: ShiftRoomModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only fetch when modal is open and booking exists
  const { data: availableRooms, isLoading: roomsLoading, error } = useQuery({
    queryKey: ['available-rooms', booking?.checkIn, booking?.checkOut, booking?.id],
    queryFn: async () => {
      if (!booking) return [];
      console.log('Fetching available rooms for booking:', booking.id);
      return bookingsApi.getAvailableRooms(booking.checkIn, booking.checkOut, booking.id);
    },
    enabled: isOpen && !!booking,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  });

  const shiftRoomMutation = useMutation({
    mutationFn: async ({ bookingId, newRoomId }: { bookingId: string; newRoomId: string }) => {
      setIsLoading(true);
      try {
        return await bookingsApi.shiftRoom(bookingId, newRoomId);
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      
      const priceDiff = data.priceDifference || 0;
      const priceMessage = priceDiff !== 0 
        ? `. Price difference: ₹${priceDiff > 0 ? '+' : ''}${Math.abs(priceDiff).toLocaleString()}` 
        : '';
      
      toast({
        title: 'Room Shifted Successfully',
        description: `Customer moved from Room ${data.oldRoom?.room_number} to Room ${data.newRoom.room_number}${priceMessage}`,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Room shift error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to shift room',
        variant: 'destructive',
      });
    },
  });

  const handleShiftRoom = () => {
    if (!booking || !selectedRoomId || isLoading) return;
    shiftRoomMutation.mutate({ bookingId: booking.id, newRoomId: selectedRoomId });
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRoomId('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shift Room - {booking.customerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Room Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Current Room</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Room {booking.roomNumber}</strong> - {booking.roomType}</p>
              <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
              <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Available Rooms */}
          <div>
            <Label className="text-base font-medium">Select New Room</Label>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                <p className="text-red-800 text-sm">Error loading rooms: {error.message}</p>
              </div>
            )}
            
            {roomsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading available rooms...</p>
              </div>
            ) : availableRooms && availableRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 max-h-96 overflow-y-auto">
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedRoomId === room.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-lg">Room {room.roomNumber}</h4>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Available
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">{room.type}</p>
                        <p className="text-xs text-gray-500">Floor {room.floor}</p>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-lg font-bold text-primary">
                          ₹{room.price.toLocaleString()}
                          <span className="text-xs font-normal text-gray-500">/night</span>
                        </p>
                      </div>
                      
                      {room.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{room.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg mt-3">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No rooms available</p>
                <p className="text-sm text-gray-500 mt-1">
                  All rooms are booked for the selected dates ({new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()})
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleShiftRoom}
              disabled={!selectedRoomId || isLoading || shiftRoomMutation.isPending}
              className="flex-1"
            >
              {isLoading || shiftRoomMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Shifting Room...
                </>
              ) : (
                'Shift Room'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading || shiftRoomMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────

interface PaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

function PaymentModal({ booking, isOpen, onClose }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (booking && isOpen) {
      setPaymentAmount(booking.balanceDue || 0);
      setPaymentMethod('cash');
    }
  }, [booking, isOpen]);

  const handlePayment = async () => {
    if (!booking || paymentAmount <= 0) return;

    setIsLoading(true);
    try {
      // Find the invoice for this booking
      const invoices = await invoicesApi.getAll('', { customerEmail: booking.customerEmail });
      const invoice = invoices.find(inv => inv.bookingId === booking.id);
      
      if (!invoice) {
        throw new Error('Invoice not found for this booking');
      }

      // Update the invoice with payment
      await invoicesApi.update(invoice.id, {
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({
        title: 'Payment Recorded',
        description: `Payment of ₹${paymentAmount.toLocaleString()} recorded successfully`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment - {booking.customerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span>₹{booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Already Paid:</span>
                <span>₹{(booking.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Balance Due:</span>
                <span>₹{(booking.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
            <Input
              id="paymentAmount"
              type="number"
              min="0"
              max={booking.balanceDue || 0}
              step="0.01"
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter payment amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Cash</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="gpay"
                  checked={paymentMethod === 'gpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>GPay</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mim"
                  checked={paymentMethod === 'mim'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>MIM</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePayment}
              disabled={isLoading || paymentAmount <= 0}
              className="flex-1"
            >
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':   return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked_in':  return 'bg-green-100 text-green-800 border-green-200';
    case 'checked_out': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':   return 'bg-red-100 text-red-800 border-red-200';
    default:            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Bookings() {
  const { user, isCustomer } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [shiftingBooking, setShiftingBooking] = useState<Booking | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllBookings, setShowAllBookings] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', filter],
    queryFn: () => bookingsApi.getAll(filter),
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Success', description: 'Booking status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update booking status', variant: 'destructive' });
    },
  });

  const handleCheckIn  = (id: string) => updateBookingStatusMutation.mutate({ id, status: 'checked_in' });
  const handleCheckOut = (id: string) => updateBookingStatusMutation.mutate({ id, status: 'checked_out' });

  const filterBookingsByDate = (list: Booking[]) => {
    if (showAllBookings) return list;
    const sel = format(selectedDate, 'yyyy-MM-dd');
    return list.filter((b) => b.checkIn === sel || b.checkOut === sel);
  };

  const sortedBookings = bookings
    ? [...bookings].sort((a: Booking, b: Booking) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
    : [];

  const displayBookings = isCustomer
    ? filterBookingsByDate(sortedBookings.filter((b: Booking) => b.customerEmail === user?.email))
    : filterBookingsByDate(sortedBookings);

  // Show "draft exists" indicator on the New Booking button
  const addFormDraft = loadFromStorage(STORAGE_KEYS.ADD_FORM, null);
  const hasAddDraft = addFormDraft && (addFormDraft as any).customerName;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isCustomer ? 'My Bookings' : 'Booking Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCustomer
                ? 'View and manage your hotel reservations'
                : 'Manage hotel bookings and reservations'}
            </p>
          </div>
          {!isCustomer && (
            <div className="relative">
              <Button
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
              {hasAddDraft && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" title="Unsaved draft exists" />
              )}
            </div>
          )}
        </div>

        {/* Compact Date Filter Bar */}
        <Card className="bg-[#2c4a6b] border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30 flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white leading-none">{format(selectedDate, 'dd')}</div>
                    <div className="text-xs text-white/80 uppercase">{format(selectedDate, 'MMM')}</div>
                  </div>
                  <div className="h-10 w-px bg-white/30"></div>
                  <div>
                    <div className="text-sm font-medium text-white/80">{format(selectedDate, 'EEEE')}</div>
                    <div className="text-xs text-white/70">{format(selectedDate, 'yyyy')}</div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                  <div className="text-xs text-white/80 mb-0.5">
                    {showAllBookings ? 'All Bookings' : "Today's Bookings"}
                  </div>
                  <div className="text-2xl font-bold text-white leading-none">{displayBookings?.length || 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="bg-white text-[#2c4a6b] hover:bg-blue-50 font-semibold shadow-md">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Select Date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { if (date) { setSelectedDate(date); setShowAllBookings(false); } }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  onClick={() => setShowAllBookings(!showAllBookings)}
                  className={`font-semibold shadow-md ${showAllBookings ? 'bg-white text-[#2c4a6b] hover:bg-blue-50' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
                >
                  {showAllBookings ? 'Today Only' : 'Show All'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setSelectedDate(new Date()); setShowAllBookings(false); }}
                  className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-semibold shadow-md"
                >
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        {!isCustomer && (
          <div className="flex gap-2">
            <Button variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>All Bookings</Button>
            <Button variant={filter === 'checkin' ? 'default' : 'outline'} onClick={() => setFilter('checkin')}>
              <LogIn className="h-4 w-4 mr-2" />Check-in Ready
            </Button>
            <Button variant={filter === 'checkout' ? 'default' : 'outline'} onClick={() => setFilter('checkout')}>
              <LogOut className="h-4 w-4 mr-2" />Check-out Ready
            </Button>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {displayBookings?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-muted-foreground mb-4">
                  {isCustomer ? "You don't have any bookings yet." : 'No bookings match the current filter.'}
                </p>
                {!isCustomer && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Create Booking
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            displayBookings?.map((booking: Booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg">{booking.customerName}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1"><Mail className="h-4 w-4" />{booking.customerEmail}</div>
                          <div className="flex items-center gap-1"><Phone className="h-4 w-4" />{booking.customerPhone}</div>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Room Details</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Room {booking.roomNumber} - {booking.roomType}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-4 w-4" />
                          <span>{booking.adults} Adults</span>
                          {booking.children > 0 && <span>, {booking.children} Children</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Stay Duration</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}{booking.checkInTime && ` at ${booking.checkInTime}`}</p>
                        <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}{booking.checkOutTime && ` at ${booking.checkOutTime}`}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Payment Status</h4>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-primary">
                          ₹{booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {booking.paymentStatus && (
                          <div className="text-xs">
                            {booking.paymentStatus === 'paid' && (
                              <span className="text-green-600 font-medium">✓ Fully Paid</span>
                            )}
                            {booking.paymentStatus === 'partial' && (
                              <div className="space-y-1">
                                <span className="text-orange-600 font-medium">⚠ Partial Payment</span>
                                <div className="text-xs text-muted-foreground">
                                  Paid: ₹{(booking.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-orange-600 font-medium">
                                  Due: ₹{(booking.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            )}
                            {booking.paymentStatus === 'pending' && (
                              <span className="text-red-600 font-medium">⏳ Payment Pending</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setViewingBooking(booking)}>
                      <Eye className="h-4 w-4 mr-1" />View Details
                    </Button>
                    {!isCustomer && (
                      <Button variant="outline" size="sm" onClick={() => setEditingBooking(booking)}>
                        <Edit className="h-4 w-4 mr-1" />Edit
                      </Button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'checked_in') && !isCustomer && (
                      <Button variant="outline" size="sm" onClick={() => setShiftingBooking(booking)}>
                        <ArrowRightLeft className="h-4 w-4 mr-1" />Shift Room
                      </Button>
                    )}
                    {booking.status === 'confirmed' && !isCustomer && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleCheckIn(booking.id)} disabled={updateBookingStatusMutation.isPending}>
                        <LogIn className="h-4 w-4 mr-1" />Check In
                      </Button>
                    )}
                    {booking.status === 'checked_in' && !isCustomer && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleCheckOut(booking.id)} disabled={updateBookingStatusMutation.isPending}>
                        <LogOut className="h-4 w-4 mr-1" />Check Out
                      </Button>
                    )}
                    {(booking.paymentStatus === 'pending' || booking.paymentStatus === 'partial') && booking.balanceDue && booking.balanceDue > 0 && !isCustomer && (
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setPaymentBooking(booking)}>
                        <CreditCard className="h-4 w-4 mr-1" />Mark as Paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modals */}
        <AddBookingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        <ViewBookingModal booking={viewingBooking} isOpen={!!viewingBooking} onClose={() => setViewingBooking(null)} />
        <EditBookingModal booking={editingBooking} isOpen={!!editingBooking} onClose={() => setEditingBooking(null)} />
        <ShiftRoomModal booking={shiftingBooking} isOpen={!!shiftingBooking} onClose={() => setShiftingBooking(null)} />
        <PaymentModal booking={paymentBooking} isOpen={!!paymentBooking} onClose={() => setPaymentBooking(null)} />
      </div>
    </DashboardLayout>
  );
}