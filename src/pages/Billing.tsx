import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Receipt, Download, Eye, CreditCard, Clock, CheckCircle, MessageCircle, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invoicesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  bookingId: string;
  customerName: string;
  customer2Name?: string;
  customerEmail: string;
  customerPhone: string;
  customerGstNumber?: string;
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
  createdAt?: string;
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Invoice Details - {invoice.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-2">
          {/* Header with Logo */}
          <div className="text-center border-b-2 border-blue-600 pb-6">
            <div className="flex items-center justify-center gap-4 mb-3">
              <img 
                src="/hk.png" 
                alt="Hotel Krishna" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h2 className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Georgia, serif' }}>
                  HOTEL KRISHNA
                </h2>
                <p className="text-sm text-gray-600 italic">Your Comfort, Our Priority</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xl font-semibold text-gray-800">TAX INVOICE</p>
              <p className="text-sm text-gray-600">Invoice No: <span className="font-semibold text-gray-800">{invoice.id}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-semibold text-gray-800">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></p>
            </div>
          </div>

          {/* Customer & Room Info - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-700 mb-3 text-base border-b border-blue-300 pb-2">Guest Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Name:</span>
                  <span className="text-gray-900">{invoice.customerName}</span>
                </div>
                {invoice.customer2Name && (
                  <div className="flex">
                    <span className="font-semibold text-gray-700 w-20">Guest 2:</span>
                    <span className="text-gray-900">{invoice.customer2Name}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Email:</span>
                  <span className="text-gray-900 break-all">{invoice.customerEmail}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Phone:</span>
                  <span className="text-gray-900">{invoice.customerPhone}</span>
                </div>
                {invoice.customerGstNumber && (
                  <div className="flex">
                    <span className="font-semibold text-gray-700 w-20">GST No:</span>
                    <span className="text-gray-900 font-mono text-xs">{invoice.customerGstNumber}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-700 mb-3 text-base border-b border-blue-300 pb-2">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Room:</span>
                  <span className="text-gray-900">{invoice.roomNumber} - {invoice.roomType}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Check-in:</span>
                  <span className="text-gray-900">{new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Check-out:</span>
                  <span className="text-gray-900">{new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Duration:</span>
                  <span className="text-gray-900 font-semibold">{invoice.days} night{invoice.days > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-base">Charges Breakdown</h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-300 shadow-sm space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gray-700 font-medium">Room Charges ({invoice.days} night{invoice.days > 1 ? 's' : ''})</span>
                <span className="text-gray-900 font-semibold text-lg">₹{invoice.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gray-700 font-medium">Additional Charges</span>
                <span className="text-gray-900 font-semibold text-lg">₹{invoice.additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">CGST (2.5%)</span>
                  <span className="text-gray-800 font-medium">₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">SGST (2.5%)</span>
                  <span className="text-gray-800 font-medium">₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="border-t-2 border-blue-600 pt-3 mt-3 flex justify-between items-center">
                <span className="text-gray-900 font-bold text-xl">Total Amount</span>
                <span className="text-blue-600 font-bold text-2xl">₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <span className="font-semibold text-gray-800 text-base">Payment Status:</span>
            <Badge className={`${getPaymentStatusColor(invoice.paymentStatus)} text-base px-4 py-2`}>
              <div className="flex items-center gap-2">
                {getPaymentStatusIcon(invoice.paymentStatus)}
                <span className="font-semibold">{invoice.paymentStatus.toUpperCase()}</span>
              </div>
            </Badge>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="font-medium">Thank you for choosing Hotel Krishna!</p>
            <p className="text-xs mt-1">For any queries, please contact us at the reception.</p>
          </div>

          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllInvoices, setShowAllInvoices] = useState(false);
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

  // Filter invoices by selected date
  const filterInvoicesByDate = (invoicesList: Invoice[]) => {
    if (showAllInvoices) {
      return invoicesList;
    }
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return invoicesList.filter((invoice: Invoice) => {
      const invoiceDate = invoice.invoiceDate;
      // Show invoices where invoice date matches the selected date
      return invoiceDate === selectedDateStr;
    });
  };

  // Sort invoices by creation date (newest first)
  const sortedInvoices = invoices ? [...invoices].sort((a: Invoice, b: Invoice) => {
    const dateA = new Date(a.createdAt || a.invoiceDate).getTime();
    const dateB = new Date(b.createdAt || b.invoiceDate).getTime();
    return dateB - dateA; // Newest first
  }) : [];

  // Filter invoices for customers to show only their own
  const displayInvoices = isCustomer 
    ? filterInvoicesByDate(sortedInvoices.filter((invoice: Invoice) => invoice.customerEmail === user?.email))
    : filterInvoicesByDate(sortedInvoices);

  const handleDownloadPdf = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();
      
      // Helper function to format currency
      const formatCurrency = (amount: number): string => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };
      
      // Set font sizes
      const titleSize = 24;
      const subtitleSize = 10;
      const headingSize = 13;
      const normalSize = 10;
      const smallSize = 9;
      
      // Colors
      const primaryBlue = [37, 99, 235]; // #2563eb
      const darkGray = [31, 41, 55]; // #1f2937
      const mediumGray = [107, 114, 128]; // #6b7280
      const lightGray = [229, 231, 235]; // #e5e7eb
      
      let yPos = 20;
      
      // Add logo if available
      const logoImg = new Image();
      logoImg.src = '/hk.png';
      try {
        doc.addImage(logoImg, 'PNG', 20, yPos, 20, 20);
      } catch (e) {
        // Logo not available, skip
      }
      
      // Header - Hotel Name
      doc.setFontSize(titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('HOTEL KRISHNA', 45, yPos + 10);
      
      doc.setFontSize(subtitleSize);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text('Your Comfort, Our Priority', 45, yPos + 16);
      
      // Invoice Title
      yPos += 30;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('TAX INVOICE', 105, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text('Invoice No: ', 105, yPos, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      const invoiceNoWidth = doc.getTextWidth('Invoice No: ');
      doc.text(invoice.id, 105 + invoiceNoWidth / 2, yPos, { align: 'left' });
      
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      const dateStr = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text('Date: ', 105, yPos, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      const dateWidth = doc.getTextWidth('Date: ');
      doc.text(dateStr, 105 + dateWidth / 2, yPos, { align: 'left' });
      
      // Blue separator line
      yPos += 8;
      doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setLineWidth(1);
      doc.line(20, yPos, 190, yPos);
      
      // Guest Information Box
      yPos += 10;
      const guestBoxHeight = invoice.customer2Name && invoice.customerGstNumber ? 44 : 
                             invoice.customer2Name || invoice.customerGstNumber ? 38 : 32;
      
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.setDrawColor(191, 219, 254); // Blue border
      doc.roundedRect(20, yPos, 80, guestBoxHeight, 2, 2, 'FD');
      
      doc.setFontSize(headingSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Guest Information', 25, yPos + 7);
      
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      yPos += 14;
      doc.text('Name:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.customerName, 42, yPos);
      
      if (invoice.customer2Name) {
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Guest 2:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.customer2Name, 42, yPos);
      }
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(smallSize);
      doc.text(invoice.customerEmail, 42, yPos);
      
      yPos += 6;
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.customerPhone, 42, yPos);
      
      if (invoice.customerGstNumber) {
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('GST No:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(smallSize);
        doc.text(invoice.customerGstNumber, 42, yPos);
        doc.setFontSize(normalSize);
      }
      
      // Booking Details Box - aligned with Guest Info
      const bookingYPos = yPos - (invoice.customer2Name && invoice.customerGstNumber ? 38 : 
                                   invoice.customer2Name || invoice.customerGstNumber ? 32 : 26);
      
      doc.setFillColor(239, 246, 255); // Light blue background (same as guest info)
      doc.setDrawColor(191, 219, 254); // Blue border
      doc.roundedRect(110, bookingYPos, 80, 38, 2, 2, 'FD');
      
      doc.setFontSize(headingSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Booking Details', 115, bookingYPos + 7);
      
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      let bookingY = bookingYPos + 14;
      doc.text('Room:', 115, bookingY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.roomNumber + ' - ' + invoice.roomType, 132, bookingY);
      
      bookingY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Check-in:', 115, bookingY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 137, bookingY);
      
      bookingY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Check-out:', 115, bookingY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 140, bookingY);
      
      bookingY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Duration:', 115, bookingY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.days + ' night' + (invoice.days > 1 ? 's' : ''), 135, bookingY);
      
      // Charges Breakdown
      yPos += 20;
      doc.setFontSize(headingSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Charges Breakdown', 20, yPos);
      
      // Charges table background
      yPos += 5;
      doc.setFillColor(249, 250, 251); // Light gray
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(20, yPos, 170, 50, 2, 2, 'FD');
      
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      yPos += 10;
      
      // Room charges
      doc.text('Room Charges (' + invoice.days + ' night' + (invoice.days > 1 ? 's' : '') + ')', 25, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text('Rs. ' + formatCurrency(invoice.roomCharges), 185, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Additional Charges', 25, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text('Rs. ' + formatCurrency(invoice.additionalCharges), 185, yPos, { align: 'right' });
      
      // Tax separator
      yPos += 10;
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.line(25, yPos, 185, yPos);
      
      yPos += 7;
      doc.setFontSize(smallSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text('CGST (2.5%)', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.cgst), 185, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('SGST (2.5%)', 25, yPos);
      doc.text('Rs. ' + formatCurrency(invoice.sgst), 185, yPos, { align: 'right' });
      
      // Total section
      yPos += 12;
      doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setLineWidth(1);
      doc.line(20, yPos, 190, yPos);
      
      yPos += 8;
      doc.setFontSize(headingSize + 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Total Amount', 25, yPos);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Rs. ' + formatCurrency(invoice.total), 185, yPos, { align: 'right' });
      
      // Payment Status
      yPos += 15;
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Payment Status:', 20, yPos);
      
      if (invoice.paymentStatus === 'paid') {
        doc.setTextColor(22, 163, 74); // green
        doc.text('PAID', 60, yPos);
      } else {
        doc.setTextColor(234, 179, 8); // yellow
        doc.text('PENDING', 60, yPos);
      }
      
      // Footer
      yPos = 270;
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('Thank you for choosing Hotel Krishna!', 105, yPos, { align: 'center' });
      
      yPos += 5;
      doc.setFontSize(smallSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text('For any queries, please contact us at the reception.', 105, yPos, { align: 'center' });
      
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
      const guestInfo = invoice.customer2Name 
        ? `*Guests:* ${invoice.customerName} & ${invoice.customer2Name}\n`
        : `*Guest:* ${invoice.customerName}\n`;
      
      const gstInfo = invoice.customerGstNumber 
        ? `GST No: ${invoice.customerGstNumber}\n`
        : '';
      
      const message = `*🏨 HOTEL KRISHNA - TAX INVOICE*\n\n` +
        `Invoice No: ${invoice.id}\n` +
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*GUEST INFORMATION*\n` +
        guestInfo +
        `Email: ${invoice.customerEmail}\n` +
        `Phone: ${invoice.customerPhone}\n` +
        gstInfo +
        `\n*BOOKING DETAILS*\n` +
        `Room: ${invoice.roomNumber} - ${invoice.roomType}\n` +
        `Check-in: ${new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
        `Check-out: ${new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
        `Duration: ${invoice.days} night${invoice.days > 1 ? 's' : ''}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*CHARGES BREAKDOWN*\n` +
        `Room Charges: ₹${invoice.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `Additional: ₹${invoice.additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `CGST (2.5%): ₹${invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `SGST (2.5%): ₹${invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*TOTAL AMOUNT: ₹${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
        `Payment Status: ${invoice.paymentStatus.toUpperCase()}\n\n` +
        `Thank you for choosing Hotel Krishna! 🙏`;
      
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

        {/* Compact Date Filter Bar */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-lg">
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
                    {showAllInvoices ? 'All Invoices' : 'Today\'s Invoices'}
                  </div>
                  <div className="text-2xl font-bold text-white leading-none">
                    {displayInvoices?.length || 0}
                  </div>
                </div>
              </div>
              
              {/* Compact Action Buttons */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
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
                          setShowAllInvoices(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  size="sm"
                  onClick={() => setShowAllInvoices(!showAllInvoices)}
                  className={`font-semibold shadow-md ${
                    showAllInvoices 
                      ? 'bg-white text-blue-600 hover:bg-blue-50' 
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  {showAllInvoices ? 'Today Only' : 'Show All'}
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowAllInvoices(false);
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
                        <CardTitle className="text-lg">Room {invoice.roomNumber} - {invoice.customerName}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{invoice.roomType}</span>
                          <span>•</span>
                          <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-mono text-xs">ID: {invoice.id.slice(0, 8)}</span>
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