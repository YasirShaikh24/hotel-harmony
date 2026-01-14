import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, Download, Eye, CreditCard, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invoicesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  days: number;
  roomCharges: number;
  additionalCharges: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  invoiceDate: string;
}

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    default:
      return <Receipt className="h-4 w-4" />;
  }
};

function ViewInvoiceModal({ invoice, isOpen, onClose }: ViewInvoiceModalProps) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details - {invoice.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">HOTEL INVOICE</h2>
            <p className="text-muted-foreground">Invoice #{invoice.id}</p>
            <p className="text-sm text-muted-foreground">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>

          {/* Customer & Room Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {invoice.customerName}</p>
                <p><strong>Email:</strong> {invoice.customerEmail}</p>
                <p><strong>Phone:</strong> {invoice.customerPhone}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Room Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Room:</strong> {invoice.roomNumber} - {invoice.roomType}</p>
                <p><strong>Check-in:</strong> {new Date(invoice.checkIn).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> {new Date(invoice.checkOut).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {invoice.days} nights</p>
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Charges Breakdown</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Room Charges ({invoice.days} nights)</span>
                <span>₹{invoice.roomCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Charges</span>
                <span>₹{invoice.additionalCharges.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>CGST (9%)</span>
                  <span>₹{invoice.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST (9%)</span>
                  <span>₹{invoice.sgst.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">₹{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Payment Status:</span>
            <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
              <div className="flex items-center gap-1">
                {getPaymentStatusIcon(invoice.paymentStatus)}
                {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
              </div>
            </Badge>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Billing() {
  const { user, isCustomer } = useAuth();
  const [filter, setFilter] = useState<string>('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => invoicesApi.getAll(filter),
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      invoicesApi.update(id, { paymentStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Payment status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    },
  });

  // Filter invoices for customers to show only their own
  const displayInvoices = isCustomer 
    ? invoices?.filter((invoice: Invoice) => invoice.customerEmail === user?.email)
    : invoices;

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const response = await invoicesApi.generatePdf(invoice.id);
      const today = new Date().toISOString().split('T')[0];
      const filename = `${today}_Room${invoice.roomNumber}_${invoice.id}.pdf`;
      
      // Create download link
      const downloadUrl = invoicesApi.downloadPdf(invoice.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: `PDF downloaded as ${filename}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = async (invoice: Invoice) => {
    try {
      const response = await invoicesApi.shareWhatsApp(invoice.id);
      toast({
        title: 'Success',
        description: `Invoice sent to ${invoice.customerPhone} via WhatsApp`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send via WhatsApp',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updatePaymentStatusMutation.mutate({ id: invoiceId, status: 'paid' });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading invoices...</p>
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
              {isCustomer ? 'My Invoices' : 'Billing & Invoices'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCustomer 
                ? 'View and download your invoices'
                : 'Manage billing, invoices, and payments'
              }
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        {!isCustomer && (
          <div className="flex gap-2">
            <Button 
              variant={filter === '' ? 'default' : 'outline'}
              onClick={() => setFilter('')}
            >
              All Invoices
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </Button>
            <Button 
              variant={filter === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilter('paid')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Paid
            </Button>
          </div>
        )}

        {/* Invoices List */}
        <div className="space-y-4">
          {displayInvoices?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">
                  {isCustomer 
                    ? "You don't have any invoices yet."
                    : "No invoices match the current filter."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            displayInvoices?.map((invoice: Invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{invoice.id}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{invoice.customerName}</span>
                          <span>•</span>
                          <span>Room {invoice.roomNumber}</span>
                          <span>•</span>
                          <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                        <div className="flex items-center gap-1">
                          {getPaymentStatusIcon(invoice.paymentStatus)}
                          {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Stay Details</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Check-in: {new Date(invoice.checkIn).toLocaleDateString()}</p>
                        <p>Check-out: {new Date(invoice.checkOut).toLocaleDateString()}</p>
                        <p>Duration: {invoice.days} nights</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Charges Breakdown</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Room Charges: ₹{invoice.roomCharges.toLocaleString()}</p>
                        <p>Additional: ₹{invoice.additionalCharges.toLocaleString()}</p>
                        <p>CGST: ₹{invoice.cgst.toLocaleString()}</p>
                        <p>SGST: ₹{invoice.sgst.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Payment Info</h4>
                      <div className="text-lg font-bold text-primary">
                        ₹{invoice.total.toLocaleString()}
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>{invoice.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadPdf(invoice)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShareWhatsApp(invoice)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Share WhatsApp
                    </Button>
                    {invoice.paymentStatus === 'pending' && !isCustomer && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        disabled={updatePaymentStatusMutation.isPending}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Mark as Paid
                      </Button>
                    )}
                    {invoice.paymentStatus === 'pending' && isCustomer && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Invoice Modal */}
        <ViewInvoiceModal
          invoice={viewingInvoice}
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      </div>
    </DashboardLayout>
  );
}