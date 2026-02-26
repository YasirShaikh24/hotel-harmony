import React, { useState } from 'react';
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
import { CalendarCheck, Users, Phone, Mail, Plus, Eye, Edit, LogIn, LogOut, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, roomsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  aadharNumber?: string;
  customer2Name?: string;
  customerGstNumber?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: string;
  adults: number;
  children: number;
  totalAmount: number;
  advanceAmount?: number;
  advancePaymentMethod?: string;
  specialRequests?: string;
  createdAt?: string;
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
    aadharNumber: '',
    customer2Name: '',
    customerGstNumber: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalAmount: 0,
    advanceAmount: 0,
    advancePaymentMethod: '',
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedRoomPrice(0);
      setSelectedRoomType('');
    }
  }, [isOpen]);

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const addBookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Booking creation error:', error);
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
      setFormData({ ...formData, roomNumber });
      calculateTotal(formData.checkIn, formData.checkOut, room.price);
    }
  };

  const calculateTotal = (checkIn: string, checkOut: string, roomPrice: number) => {
    if (checkIn && checkOut && roomPrice) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const total = roomPrice * Math.max(1, days);
      setFormData(prev => ({ ...prev, totalAmount: total }));
    }
  };

  const handleDateChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (field === 'checkIn' || field === 'checkOut') {
      calculateTotal(
        field === 'checkIn' ? value : formData.checkIn,
        field === 'checkOut' ? value : formData.checkOut,
        selectedRoomPrice
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.customerPhone.length !== 10) {
      toast({
        title: 'Invalid Mobile Number',
        description: 'Mobile number must be exactly 10 digits',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.aadharNumber.length !== 12) {
      toast({
        title: 'Invalid Aadhar Number',
        description: 'Aadhar number must be exactly 12 digits',
        variant: 'destructive',
      });
      return;
    }

    if (formData.advanceAmount > 0 && !formData.advancePaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method for the advance payment',
        variant: 'destructive',
      });
      return;
    }
    
    addBookingMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
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
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setFormData({ ...formData, customerPhone: value });
                  }
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

          <div className="space-y-2">
            <Label htmlFor="aadharNumber">Aadhar Card Number</Label>
            <Input
              id="aadharNumber"
              value={formData.aadharNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 12) {
                  setFormData({ ...formData, aadharNumber: value });
                }
              }}
              placeholder="Enter 12-digit Aadhar number"
              maxLength={12}
              required
            />
            {formData.aadharNumber && formData.aadharNumber.length !== 12 && (
              <p className="text-sm text-red-600">Aadhar number must be exactly 12 digits</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerGstNumber">GST Number (Optional)</Label>
            <Input
              id="customerGstNumber"
              value={formData.customerGstNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 15) {
                  setFormData({ ...formData, customerGstNumber: value });
                }
              }}
              placeholder="Enter 15-character GST number (if applicable)"
              maxLength={15}
            />
            {formData.customerGstNumber && formData.customerGstNumber.length > 0 && formData.customerGstNumber.length !== 15 && (
              <p className="text-sm text-yellow-600">GST number should be 15 characters</p>
            )}
            <p className="text-xs text-muted-foreground">
              For business travelers who need GST invoice
            </p>
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
                min={formData.checkIn || today}
                value={formData.checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
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
            <Label htmlFor="addTotalAmount">Base Amount (₹)</Label>
            <Input
              id="addTotalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount || ''}
              onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter base amount"
              required
            />
          </div>

          {formData.totalAmount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Amount:</span>
                <span className="font-medium">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST (2.5%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (2.5%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(formData.totalAmount + (formData.totalAmount * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="advanceAmount">Advance Payment (₹)</Label>
            <Input
              id="advanceAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.advanceAmount || ''}
              onChange={(e) => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter advance payment amount"
            />
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
              </div>
            </div>
          )}

          {formData.totalAmount > 0 && formData.advanceAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-medium">₹{(formData.totalAmount + (formData.totalAmount * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Advance Paid:</span>
                <span className="font-medium text-green-600">-₹{formData.advanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Due Amount:</span>
                <span className="text-orange-600">₹{((formData.totalAmount + (formData.totalAmount * 0.05)) - formData.advanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={addBookingMutation.isPending} className="flex-1">
              {addBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
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
              <p><strong>Email:</strong> {booking.customerEmail}</p>
              <p><strong>Phone:</strong> {booking.customerPhone}</p>
              <p><strong>Aadhar:</strong> {booking.aadharNumber}</p>
              {booking.customerGstNumber && (
                <p><strong>GST No:</strong> <span className="font-mono text-xs">{booking.customerGstNumber}</span></p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Room Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Room:</strong> {booking.roomNumber} - {booking.roomType}</p>
              <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
              <p><strong>Guests:</strong> {booking.adults} Adults, {booking.children} Children</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Billing Details</h4>
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Base Amount:</span>
                <span className="font-medium">₹{booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST (2.5%):</span>
                <span className="font-medium">₹{(booking.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (2.5%):</span>
                <span className="font-medium">₹{(booking.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(booking.totalAmount + (booking.totalAmount * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                    <span>₹{((booking.totalAmount + (booking.totalAmount * 0.05)) - booking.advanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
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
    aadharNumber: '',
    customer2Name: '',
    customerGstNumber: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalAmount: 0,
    status: 'confirmed',
  });
  const [selectedRoomType, setSelectedRoomType] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  // Update form data when booking changes
  React.useEffect(() => {
    if (booking) {
      setFormData({
        customerName: booking.customerName || '',
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        aadharNumber: booking.aadharNumber || '',
        customer2Name: booking.customer2Name || '',
        customerGstNumber: booking.customerGstNumber || '',
        roomNumber: booking.roomNumber || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        totalAmount: booking.totalAmount || 0,
        status: booking.status || 'confirmed',
      });
      setSelectedRoomType(booking.roomType || '');
    }
  }, [booking]);

  // Auto-calculate amount when room or dates change
  const handleRoomChange = (roomNumber: string) => {
    const room = rooms?.find((r: Room) => r.roomNumber === roomNumber);
    if (room && formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const calculatedAmount = room.price * Math.max(1, days);
      setSelectedRoomType(room.type);
      setFormData({ ...formData, roomNumber, totalAmount: calculatedAmount });
    } else {
      if (room) {
        setSelectedRoomType(room.type);
      }
      setFormData({ ...formData, roomNumber });
    }
  };

  const handleDateChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-calculate amount if both dates and room are selected
    if (newFormData.roomNumber && newFormData.checkIn && newFormData.checkOut) {
      const room = rooms?.find((r: Room) => r.roomNumber === newFormData.roomNumber);
      if (room) {
        const checkInDate = new Date(newFormData.checkIn);
        const checkOutDate = new Date(newFormData.checkOut);
        const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const calculatedAmount = room.price * Math.max(1, days);
        newFormData.totalAmount = calculatedAmount;
      }
    }
    
    setFormData(newFormData);
  };

  const updateBookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.update(booking!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: 'Success',
        description: 'Booking updated successfully',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingMutation.mutate(formData);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
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
              {rooms?.filter((room: Room) => room.status === 'available' || room.roomNumber === formData.roomNumber).map((room: Room) => (
                <option key={room.id} value={room.roomNumber}>
                  Room {room.roomNumber} - {room.type} (₹{room.price.toLocaleString()}/day)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCustomerName">Customer Name</Label>
            <Input
              id="editCustomerName"
              value={formData.customerName}
              readOnly
              className="bg-muted"
            />
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
              <Label htmlFor="editCustomerEmail">Customer Email</Label>
              <Input
                id="editCustomerEmail"
                type="email"
                value={formData.customerEmail}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCustomerPhone">Customer Phone</Label>
              <Input
                id="editCustomerPhone"
                value={formData.customerPhone}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAadharNumber">Aadhar Card Number</Label>
            <Input
              id="editAadharNumber"
              value={formData.aadharNumber}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCustomerGstNumber">GST Number (Optional)</Label>
            <Input
              id="editCustomerGstNumber"
              value={formData.customerGstNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 15) {
                  setFormData({ ...formData, customerGstNumber: value });
                }
              }}
              placeholder="Enter 15-character GST number (if applicable)"
              maxLength={15}
            />
            {formData.customerGstNumber && formData.customerGstNumber.length > 0 && formData.customerGstNumber.length !== 15 && (
              <p className="text-sm text-yellow-600">GST number should be 15 characters</p>
            )}
            <p className="text-xs text-muted-foreground">
              For business travelers who need GST invoice
            </p>
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
                min={formData.checkIn || today}
                value={formData.checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
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
            <Label htmlFor="editTotalAmount">Base Amount (₹)</Label>
            <Input
              id="editTotalAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalAmount || ''}
              onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
              placeholder="Enter base amount"
              required
            />
          </div>

          {formData.totalAmount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Amount:</span>
                <span className="font-medium">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST (2.5%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (2.5%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.025).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(formData.totalAmount + (formData.totalAmount * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="confirmed"
                  checked={formData.status === 'confirmed'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <span>Confirmed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="checked_in"
                  checked={formData.status === 'checked_in'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <span>Checked In</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="checked_out"
                  checked={formData.status === 'checked_out'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <span>Checked Out</span>
              </label>
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked_in':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'checked_out':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

export default function Bookings() {
  const { user, isCustomer } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
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
      toast({
        title: 'Success',
        description: 'Booking status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    },
  });

  const handleCheckIn = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ id: bookingId, status: 'checked_in' });
  };

  const handleCheckOut = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ id: bookingId, status: 'checked_out' });
  };

  // Filter bookings by selected date
  const filterBookingsByDate = (bookingsList: Booking[]) => {
    if (showAllBookings) {
      return bookingsList;
    }
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookingsList.filter((booking: Booking) => {
      const checkInDate = booking.checkIn;
      const checkOutDate = booking.checkOut;
      // Show bookings where check-in or check-out matches the selected date
      return checkInDate === selectedDateStr || checkOutDate === selectedDateStr;
    });
  };

  // Sort bookings by creation date (newest first)
  const sortedBookings = bookings ? [...bookings].sort((a: Booking, b: Booking) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // Newest first
  }) : [];

  const displayBookings = isCustomer 
    ? filterBookingsByDate(sortedBookings.filter((booking: Booking) => booking.customerEmail === user?.email))
    : filterBookingsByDate(sortedBookings);

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
                : 'Manage hotel bookings and reservations'
              }
            </p>
          </div>
          {!isCustomer && (
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          )}
        </div>

        {/* Compact Date Filter Bar */}
        <Card className="bg-[#2c4a6b] border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Compact Date Display */}
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30 flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white leading-none">
                      {format(selectedDate, 'dd')}
                    </div>
                    <div className="text-xs text-white/80 uppercase">
                      {format(selectedDate, 'MMM')}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/30"></div>
                  <div>
                    <div className="text-sm font-medium text-white/80">
                      {format(selectedDate, 'EEEE')}
                    </div>
                    <div className="text-xs text-white/70">
                      {format(selectedDate, 'yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                  <div className="text-xs text-white/80 mb-0.5">
                    {showAllBookings ? 'All Bookings' : 'Today\'s Bookings'}
                  </div>
                  <div className="text-2xl font-bold text-white leading-none">
                    {displayBookings?.length || 0}
                  </div>
                </div>
              </div>
              
              {/* Compact Action Buttons */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-white text-[#2c4a6b] hover:bg-blue-50 font-semibold shadow-md"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Select Date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setShowAllBookings(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  size="sm"
                  onClick={() => setShowAllBookings(!showAllBookings)}
                  className={`font-semibold shadow-md ${
                    showAllBookings 
                      ? 'bg-white text-[#2c4a6b] hover:bg-blue-50' 
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  {showAllBookings ? 'Today Only' : 'Show All'}
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowAllBookings(false);
                  }}
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
            <Button 
              variant={filter === '' ? 'default' : 'outline'}
              onClick={() => setFilter('')}
            >
              All Bookings
            </Button>
            <Button 
              variant={filter === 'checkin' ? 'default' : 'outline'}
              onClick={() => setFilter('checkin')}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Check-in Ready
            </Button>
            <Button 
              variant={filter === 'checkout' ? 'default' : 'outline'}
              onClick={() => setFilter('checkout')}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Check-out Ready
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
                  {isCustomer 
                    ? "You don't have any bookings yet."
                    : "No bookings match the current filter."
                  }
                </p>
                {!isCustomer && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Booking
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
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {booking.customerEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {booking.customerPhone}
                          </div>
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
                        <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                        <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Total Billing Amount</h4>
                      <div className="text-lg font-bold text-primary">
                        ₹{(booking.totalAmount + (booking.totalAmount * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {!isCustomer && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingBooking(booking)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {booking.status === 'confirmed' && !isCustomer && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCheckIn(booking.id)}
                        disabled={updateBookingStatusMutation.isPending}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    )}
                    {booking.status === 'checked_in' && !isCustomer && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleCheckOut(booking.id)}
                        disabled={updateBookingStatusMutation.isPending}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modals */}
        <AddBookingModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        
        <ViewBookingModal
          booking={viewingBooking}
          isOpen={!!viewingBooking}
          onClose={() => setViewingBooking(null)}
        />
        
        <EditBookingModal
          booking={editingBooking}
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
        />
      </div>
    </DashboardLayout>
  );
}