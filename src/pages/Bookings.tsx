import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarCheck, Users, Phone, Mail, Plus, Eye, Edit, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, roomsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  aadharNumber: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: string;
  adults: number;
  children: number;
  totalAmount: number;
  specialRequests?: string;
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
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalAmount: 0,
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedRoomPrice(0);
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      });
    },
  });

  const handleRoomChange = (roomNumber: string) => {
    const room = rooms?.find((r: Room) => r.roomNumber === roomNumber);
    if (room) {
      setSelectedRoomPrice(room.price);
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
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
          </div>

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
            <Label>Room Selection</Label>
            <div className="border rounded-lg p-2">
              {rooms?.filter((room: Room) => room.status === 'available').map((room: Room) => (
                <label key={room.id} className="flex items-center justify-between p-3 hover:bg-muted rounded cursor-pointer border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="roomNumber"
                      value={room.roomNumber}
                      checked={formData.roomNumber === room.roomNumber}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">Room {room.roomNumber} - ₹{room.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">({room.type})</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
                <span>CGST (9%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (9%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(formData.totalAmount + (formData.totalAmount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              <p><strong>Email:</strong> {booking.customerEmail}</p>
              <p><strong>Phone:</strong> {booking.customerPhone}</p>
              <p><strong>Aadhar:</strong> {booking.aadharNumber}</p>
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
                <span>CGST (9%):</span>
                <span className="font-medium">₹{(booking.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (9%):</span>
                <span className="font-medium">₹{(booking.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(booking.totalAmount + (booking.totalAmount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
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
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    totalAmount: 0,
    status: 'confirmed',
  });
  
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
        roomNumber: booking.roomNumber || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        totalAmount: booking.totalAmount || 0,
        status: booking.status || 'confirmed',
      });
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
      setFormData({ ...formData, roomNumber, totalAmount: calculatedAmount });
    } else {
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
            <Label htmlFor="editCustomerName">Customer Name</Label>
            <Input
              id="editCustomerName"
              value={formData.customerName}
              readOnly
              className="bg-muted"
            />
          </div>

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
            <Label>Room Selection</Label>
            <div className="border rounded-lg p-2">
              {rooms?.filter((room: Room) => room.status === 'available' || room.roomNumber === formData.roomNumber).map((room: Room) => (
                <label key={room.id} className="flex items-center justify-between p-3 hover:bg-muted rounded cursor-pointer border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="roomNumber"
                      value={room.roomNumber}
                      checked={formData.roomNumber === room.roomNumber}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">Room {room.roomNumber} - ₹{room.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">({room.type})</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
                <span>CGST (9%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST (9%):</span>
                <span className="font-medium">₹{(formData.totalAmount * 0.09).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Billing Amount:</span>
                <span className="text-primary">₹{(formData.totalAmount + (formData.totalAmount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

  const displayBookings = isCustomer 
    ? bookings?.filter((booking: Booking) => booking.customerEmail === user?.email)
    : bookings;

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
                        ₹{(booking.totalAmount + (booking.totalAmount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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