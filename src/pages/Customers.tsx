import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, Mail, Calendar, IndianRupee, Eye, Plus } from 'lucide-react';
import { customersApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalStays: number;
  totalRevenue: number;
  lastStay: string | null;
  createdAt: string;
}

interface CustomerDetails extends Customer {
  aadhar?: string;
  address?: string;
  bookings: Array<{
    id: string;
    roomNumber: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
    adults: number;
    children: number;
    amount: number;
  }>;
}

interface CustomerDetailsModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function CustomerDetailsModal({ customerId, isOpen, onClose }: CustomerDetailsModalProps) {
  const navigate = useNavigate();
  
  const { data: customer, isLoading } = useQuery<CustomerDetails>({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId!),
    enabled: !!customerId,
  });

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

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading customer details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-700 mb-4 text-lg">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Stays</p>
                      <p className="text-3xl font-bold text-blue-600">{customer.totalStays}</p>
                    </div>
                    <Calendar className="h-10 w-10 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">₹{customer.totalRevenue.toLocaleString()}</p>
                    </div>
                    <IndianRupee className="h-10 w-10 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Stay</p>
                      <p className="text-lg font-bold text-purple-600">
                        {customer.lastStay 
                          ? new Date(customer.lastStay).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short' 
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Booking History</h3>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onClose();
                    navigate('/bookings');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Booking
                </Button>
              </div>
              
              {customer.bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No booking history found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {customer.bookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-900">
                                Room {booking.roomNumber}
                              </span>
                              <span className="text-sm text-gray-600">
                                {booking.roomType}
                              </span>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status.replace('_', ' ').charAt(0).toUpperCase() + 
                                 booking.status.replace('_', ' ').slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                Check-in: {new Date(booking.checkIn).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}{booking.checkInTime && ` at ${booking.checkInTime}`}
                              </span>
                              <span>→</span>
                              <span>
                                Check-out: {new Date(booking.checkOut).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}{booking.checkOutTime && ` at ${booking.checkOutTime}`}
                              </span>
                              <span>•</span>
                              <span>{booking.adults} Adults{booking.children > 0 ? `, ${booking.children} Children` : ''}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ₹{booking.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: customers, isLoading, isFetching } = useQuery<Customer[]>({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => customersApi.getAll(debouncedSearch),
    staleTime: 30000, // Data stays fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Customer Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View customer information and bogoking history
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  autoComplete="off"
                />
                {isFetching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="h-12"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold">{customers?.length || 0}</p>
                </div>
                <Users className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {customers?.reduce((sum, c) => sum + c.totalStays, 0) || 0}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{customers?.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString() || 0}
                  </p>
                </div>
                <IndianRupee className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !customers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading customers...</p>
              </div>
            ) : customers?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No customers found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'Customers will appear here once bookings are created'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Phone</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Total Stays</th>
                      <th className="text-right p-4 font-semibold text-gray-700">Total Revenue</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Last Stay</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers?.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{customer.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="font-semibold">
                            {customer.totalStays}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-green-600">
                            ₹{customer.totalRevenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-gray-600">
                            {customer.lastStay 
                              ? new Date(customer.lastStay).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : 'N/A'
                            }
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setViewingCustomerId(customer.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Modal */}
        <CustomerDetailsModal
          customerId={viewingCustomerId}
          isOpen={!!viewingCustomerId}
          onClose={() => setViewingCustomerId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
