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
import jsPDF from 'jspdf';

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

  const handleDownloadPdf = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();
      
      // Helper function to format currency
      const formatCurrency = (amount: number): string => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };
      
      // Set font sizes
      const titleSize = 20;
      const headingSize = 14;
      const normalSize = 11;
      const smallSize = 9;
      
      // Colors
      const primaryColor = '#2563eb';
      const grayColor = '#6b7280';
      
      // Header
      doc.setFontSize(titleSize);
      doc.setTextColor(primaryColor);
      doc.text('HOTEL INVOICE', 105, 20, { align: 'center' });
      
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      doc.text('Invoice #' + invoice.id, 105, 30, { align: 'center' });
      doc.text('Date: ' + new Date(invoice.invoiceDate).toLocaleDateString(), 105, 37, { align: 'center' });
      
      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);
      
      // Customer Information
      let yPos = 55;
      doc.setFontSize(headingSize);
      doc.setTextColor(primaryColor);
      doc.text('Customer Information', 20, yPos);
      
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      doc.text('Name: ' + invoice.customerName, 20, yPos);
      yPos += 7;
      doc.text('Email: ' + invoice.customerEmail, 20, yPos);
      yPos += 7;
      doc.text('Phone: ' + invoice.customerPhone, 20, yPos);
      
      // Room Details
      yPos += 15;
      doc.setFontSize(headingSize);
      doc.setTextColor(primaryColor);
      doc.text('Room Details', 20, yPos);
      
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      doc.text('Room: ' + invoice.roomNumber + ' - ' + invoice.roomType, 20, yPos);
      yPos += 7;
      doc.text('Check-in: ' + new Date(invoice.checkIn).toLocaleDateString(), 20, yPos);
      yPos += 7;
      doc.text('Check-out: ' + new Date(invoice.checkOut).toLocaleDateString(), 20, yPos);
      yPos += 7;
      doc.text('Duration: ' + invoice.days + ' night' + (invoice.days > 1 ? 's' : ''), 20, yPos);
      
      // Charges Breakdown
      yPos += 18;
      doc.setFontSize(headingSize);
      doc.setTextColor(primaryColor);
      doc.text('Charges Breakdown', 20, yPos);
      
      // Table background
      yPos += 5;
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos, 170, 45, 'F');
      
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      
      // Room charges
      doc.text('Room Charges (' + invoice.days + ' night' + (invoice.days > 1 ? 's' : '') + ')', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.roomCharges), 185, yPos, { align: 'right' });
      yPos += 8;
      
      // Additional charges
      doc.text('Additional Charges', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.additionalCharges), 185, yPos, { align: 'right' });
      yPos += 10;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(25, yPos, 185, yPos);
      yPos += 7;
      
      // CGST
      doc.setFontSize(smallSize);
      doc.text('CGST (9%)', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.cgst), 185, yPos, { align: 'right' });
      yPos += 6;
      
      // SGST
      doc.text('SGST (9%)', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.sgst), 185, yPos, { align: 'right' });
      
      // Close the background box properly
      yPos += 8;
      
      // Total section with line
      yPos += 5;
      doc.setDrawColor(primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      
      yPos += 8;
      doc.setFontSize(headingSize);
      doc.setTextColor(primaryColor);
      doc.text('Total Amount', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.total), 185, yPos, { align: 'right' });
      
      // Payment Status
      yPos += 18;
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Status:', 20, yPos);
      
      if (invoice.paymentStatus === 'paid') {
        doc.setTextColor(34, 197, 94); // green
        doc.text('PAID', 65, yPos);
      } else {
        doc.setTextColor(234, 179, 8); // yellow
        doc.text('PENDING', 65, yPos);
      }
      
      // Footer
      yPos = 270;
      doc.setFontSize(smallSize);
      doc.setTextColor(grayColor);
      doc.text('Thank you for choosing our hotel!', 105, yPos, { align: 'center' });
      doc.text('For any queries, please contact us.', 105, yPos + 5, { align: 'center' });
      
      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      const filename = today + '_Room' + invoice.roomNumber + '_' + invoice.id + '.pdf';
      
      // Save PDF
      doc.save(filename);
      
      toast({
        title: 'Success',
        description: 'PDF downloaded as ' + filename,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    try {
      // Format the invoice details for WhatsApp
      const message = `*HOTEL INVOICE*\n\n` +
        `Invoice #: ${invoice.id}\n` +
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\n\n` +
        `*Customer:* ${invoice.customerName}\n` +
        `*Room:* ${invoice.roomNumber} - ${invoice.roomType}\n` +
        `*Check-in:* ${new Date(invoice.checkIn).toLocaleDateString()}\n` +
        `*Check-out:* ${new Date(invoice.checkOut).toLocaleDateString()}\n` +
        `*Duration:* ${invoice.days} night${invoice.days > 1 ? 's' : ''}\n\n` +
        `*Charges:*\n` +
        `Room Charges: ₹${invoice.roomCharges.toLocaleString()}\n` +
        `Additional: ₹${invoice.additionalCharges.toLocaleString()}\n` +
        `CGST (9%): ₹${invoice.cgst.toLocaleString()}\n` +
        `SGST (9%): ₹${invoice.sgst.toLocaleString()}\n\n` +
        `*Total Amount: ₹${invoice.total.toLocaleString()}*\n` +
        `Status: ${invoice.paymentStatus.toUpperCase()}`;
      
      // Remove country code if present and format phone number
      let phoneNumber = invoice.customerPhone.replace(/\D/g, '');
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber; // Add India country code
      }
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in new window
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: 'Success',
        description: 'Opening WhatsApp to share invoice',
      });
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast({
        title: 'Error',
        description: 'Failed to share via WhatsApp',
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