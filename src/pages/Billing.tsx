import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Receipt, Download, Eye, CreditCard, Clock, CheckCircle, MessageCircle, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
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
  advanceAmount?: number;
  advancePaymentMethod?: string;
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

interface PaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partial':
      return 'bg-blue-100 text-blue-800 border-blue-200';
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
    case 'partial':
      return <Clock className="h-4 w-4" />;
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0">
        
        <div className="p-12 bg-white text-gray-900">

          {/* HEADER WITH LOGO */}
          <div className="grid grid-cols-2 items-start">

            {/* LEFT SIDE - Logo + Hotel Info */}
            <div className="flex items-start gap-4">

              <img
                src="/hk.png"
                alt="Hotel Krishna"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <div>
                <h1 className="text-3xl font-semibold tracking-wide">
                  HOTEL KRISHNA
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                  1st Floor Lalita Tower, Vadodara - 390005
                </p>
                <p className="text-sm text-gray-600">
                  Phone: +91 9426786111 | info@hotelkrishna.com
                </p>
              </div>

            </div>

            {/* RIGHT SIDE - Invoice Info */}
            <div className="text-right">
              <h2 className="text-lg font-semibold uppercase tracking-widest">
                Tax Invoice
              </h2>

              <div className="mt-4 space-y-1 text-sm">
                <div>
                  <span className="font-medium">Invoice #:</span>{" "}
                  {invoice.id}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-400 my-8"></div>

          {/* BILL TO & STAY DETAILS */}
          <div className="grid grid-cols-2 gap-24 text-sm">

          <div>
          <h3 className="uppercase text-xs tracking-widest text-gray-500 mb-3">
            Bill To
          </h3>

          <p className="font-medium">{invoice.customerName}</p>
          {invoice.customer2Name && <p>{invoice.customer2Name}</p>}
          <p>{invoice.customerEmail}</p>
          <p>{invoice.customerPhone}</p>

          {/* Customer GST Number */}
          {invoice.customerGstNumber && invoice.customerGstNumber.trim() !== "" && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Customer GSTIN
              </p>
              <p className="font-medium text-gray-800">
                {invoice.customerGstNumber}
              </p>
            </div>
          )}
        </div>
            <div>
              <h3 className="uppercase text-xs tracking-widest text-gray-500 mb-3">
                Stay Details
              </h3>

              <p>Room: {invoice.roomNumber}</p>
              <p>
                Check-in: {new Date(invoice.checkIn).toLocaleDateString("en-IN")}
              </p>
              <p>
                Check-out: {new Date(invoice.checkOut).toLocaleDateString("en-IN")}
              </p>
              <p>Duration: {invoice.days} Night(s)</p>
            </div>

          </div>

          <div className="border-t border-gray-400 my-8"></div>

          {/* TABLE */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-400 text-left uppercase text-xs tracking-widest text-gray-500">
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3">Room Charges ({invoice.days} night{invoice.days > 1 ? 's' : ''})</td>
                <td className="py-3 text-right">
                  {invoice.roomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {invoice.additionalCharges > 0 && (
                <tr>
                  <td className="py-3">Additional Charges</td>
                  <td className="py-3 text-right">
                    {invoice.additionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              <tr>
                <td className="py-3">GST (5%)</td>
                <td className="py-3 text-right">
                  {(invoice.cgst + invoice.sgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              <tr className="border-t border-gray-400 font-semibold">
                <td className="py-4 text-base">Total Amount</td>
                <td className="py-4 text-right text-base">
                  {invoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {invoice.advanceAmount && invoice.advanceAmount > 0 && (
                <>
                  <tr>
                    <td className="py-3">Advance Paid</td>
                    <td className="py-3 text-right text-green-600">
                      -{invoice.advanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-3">Due Amount</td>
                    <td className="py-3 text-right">
                      {(invoice.total - invoice.advanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div className="border-t border-gray-400 mt-12 pt-6 text-center text-xs text-gray-500">
            Thank you for staying with Hotel Krishna.
          </div>

          <div className="mt-8">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
function PaymentModal({ invoice, isOpen, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GPay'>('Cash');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status, method }: { id: string; status: string; method: string }) => 
      invoicesApi.update(id, { paymentStatus: status, paymentMethod: method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoice) {
      updatePaymentMutation.mutate({ 
        id: invoice.id, 
        status: 'paid', 
        method: paymentMethod 
      });
    }
  };

  if (!invoice) return null;

  const dueAmount = invoice.total - (invoice.advanceAmount || 0);
  const amountToPay = invoice.paymentStatus === 'partial' ? dueAmount : invoice.total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {invoice.advanceAmount > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-700">
                    {invoice.paymentStatus === 'partial' ? 'Advance Paid:' : 'Previous Payment:'}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    -₹{invoice.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">
                  {invoice.paymentStatus === 'partial' ? 'Amount to Pay:' : 'Total Amount:'}
                </span>
                <span className="text-xl font-bold text-orange-600">
                  ₹{amountToPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Invoice: {invoice.id} | Room {invoice.roomNumber}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Payment Method</Label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                  style={{
                    borderColor: paymentMethod === 'Cash' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: paymentMethod === 'Cash' ? '#eff6ff' : 'white'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={paymentMethod === 'Cash'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'GPay')}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="ml-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xl">💵</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Cash Payment</span>
                      <p className="text-xs text-gray-600">Physical currency payment</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                  style={{
                    borderColor: paymentMethod === 'GPay' ? '#2563eb' : '#e5e7eb',
                    backgroundColor: paymentMethod === 'GPay' ? '#eff6ff' : 'white'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="GPay"
                    checked={paymentMethod === 'GPay'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'GPay')}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="ml-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">GPay / UPI</span>
                      <p className="text-xs text-gray-600">Digital payment via UPI</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={updatePaymentMutation.isPending} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {updatePaymentMutation.isPending ? 'Recording...' : 'Confirm Payment'}
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

export default function Billing() {
  const { user, isCustomer } = useAuth();
  const [filter, setFilter] = useState<string>('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => invoicesApi.getAll(filter),
  });

  const toggleCard = (invoiceId: string) => {
    setExpandedCards(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

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
  const doc = new jsPDF();
  let y = 20;

  const currency = (num: number) =>
    num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('HOTEL KRISHNA', 20, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('1st Floor Lalita Tower, Vadodara - 390005', 20, y + 6);
  doc.text('Phone: +91 9426786111 | info@hotelkrishna.com', 20, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TAX INVOICE', 160, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Invoice #: ${invoice.id}`, 160, y + 6, { align: 'right' });
  doc.text(
    `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`,
    160,
    y + 11,
    { align: 'right' }
  );

  y += 20;
  doc.line(20, y, 190, y);

  // Bill To
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, y);

  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(invoice.customerName, 20, y);
  y += 5;
  doc.text(invoice.customerEmail, 20, y);
  y += 5;
  doc.text(invoice.customerPhone, 20, y);
  if (invoice.customerGstNumber) {
    y += 5;
    doc.text(`GSTIN: ${invoice.customerGstNumber}`, 20, y);
  }

  // Stay Details
  doc.setFont('helvetica', 'bold');
  doc.text('STAY DETAILS', 120, y - 10);

  doc.setFont('helvetica', 'normal');
  doc.text(`Room: ${invoice.roomNumber}`, 120, y - 4);
  doc.text(
    `Check-in: ${new Date(invoice.checkIn).toLocaleDateString('en-IN')}`,
    120,
    y + 1
  );
  doc.text(
    `Check-out: ${new Date(invoice.checkOut).toLocaleDateString('en-IN')}`,
    120,
    y + 6
  );

  y += 15;
  doc.line(20, y, 190, y);

  // Charges
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, y);
  doc.text('Amount (₹)', 180, y, { align: 'right' });

  y += 3;
  doc.line(20, y, 190, y);

  const addRow = (label: string, value: number) => {
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, y);
    doc.text(currency(value), 180, y, { align: 'right' });
  };

  addRow('Room Charges', invoice.roomCharges);
  if (invoice.additionalCharges > 0) {
    addRow('Additional Charges', invoice.additionalCharges);
  }
  addRow('GST (5%)', invoice.cgst + invoice.sgst);

  y += 10;
  doc.line(120, y, 190, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 120, y);
  doc.text(currency(invoice.total), 180, y, { align: 'right' });

  if (invoice.advanceAmount > 0) {
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Advance Paid', 120, y);
    doc.text('-' + currency(invoice.advanceAmount), 180, y, { align: 'right' });

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('DUE AMOUNT', 120, y);
    doc.text(
      currency(invoice.total - invoice.advanceAmount),
      180,
      y,
      { align: 'right' }
    );
  }

  y += 20;
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for staying with us.', 105, y, { align: 'center' });

  doc.save(`Invoice_${invoice.id}.pdf`);
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
        (invoice.advanceAmount > 0 ? `Advance Paid${invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}: ₹${invoice.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` : '') +
        `CGST (2.5%): ₹${invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `SGST (2.5%): ₹${invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*TOTAL AMOUNT: ₹${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
        (invoice.advanceAmount > 0 ? `*Due Amount: ₹${(invoice.total - invoice.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` : '') +
        `Payment Status: ${invoice.paymentStatus.toUpperCase()}${invoice.paymentStatus === 'paid' && invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : invoice.paymentStatus === 'partial' && invoice.advancePaymentMethod ? ` (Advance via ${invoice.advancePaymentMethod})` : ''}\n\n` +
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

  const handleMarkAsPaid = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
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
                      ? 'bg-white text-[#2c4a6b] hover:bg-blue-50' 
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
            displayInvoices?.map((invoice: Invoice) => {
              const isExpanded = expandedCards.includes(invoice.id);
              
              return (
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
                            <span>Invoice: {invoice.id.slice(0, 8)}</span>
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
                    {/* Collapsed View - Always Visible */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-bold text-primary">₹{invoice.total.toLocaleString()}</span>
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>via {invoice.paymentMethod}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded View - Conditional */}
                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                        {/* Guest Information */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-700 mb-3 text-sm">Guest Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-20">Name:</span>
                              <span className="text-gray-900">{invoice.customerName}</span>
                            </div>
                            {invoice.customer2Name && (
                              <div className="flex">
                                <span className="font-medium text-gray-700 w-20">Guest 2:</span>
                                <span className="text-gray-900">{invoice.customer2Name}</span>
                              </div>
                            )}
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-20">Email:</span>
                              <span className="text-gray-900 break-all">{invoice.customerEmail}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-20">Phone:</span>
                              <span className="text-gray-900">{invoice.customerPhone}</span>
                            </div>
                            {invoice.customerGstNumber && (
                              <div className="flex">
                                <span className="font-medium text-gray-700 w-20">GST No:</span>
                                <span className="text-gray-900 font-mono text-xs">{invoice.customerGstNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stay Details */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-700 mb-3 text-sm">Stay Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Room:</span>
                              <span className="text-gray-900">{invoice.roomNumber} - {invoice.roomType}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Check-in:</span>
                              <span className="text-gray-900">{new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Check-out:</span>
                              <span className="text-gray-900">{new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Duration:</span>
                              <span className="text-gray-900 font-semibold">{invoice.days} night{invoice.days > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Charges Breakdown */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Charges Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Room Charges ({invoice.days} night{invoice.days > 1 ? 's' : ''}):</span>
                              <span className="font-medium text-gray-900">₹{invoice.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Additional Charges:</span>
                              <span className="font-medium text-gray-900">₹{invoice.additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">CGST (2.5%):</span>
                              <span className="text-gray-800">₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">SGST (2.5%):</span>
                              <span className="text-gray-800">₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between">
                              <span className="font-bold text-gray-900">Total Amount:</span>
                              <span className="font-bold text-primary text-lg">₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {invoice.advanceAmount > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Advance Paid:</span>
                                  <span className="font-medium text-green-600">-₹{invoice.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {invoice.advancePaymentMethod && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Advance Method:</span>
                                    <span className="text-gray-800 font-medium">{invoice.advancePaymentMethod}</span>
                                  </div>
                                )}
                                <div className="border-t pt-2 mt-2 flex justify-between">
                                  <span className="font-bold text-orange-600">Due Amount:</span>
                                  <span className="font-bold text-orange-600 text-lg">₹{(invoice.total - invoice.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Payment Info */}
                        {invoice.paymentStatus === 'paid' && invoice.paymentMethod && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-700">Payment Status:</span>
                              <span className="text-sm font-semibold text-green-900">PAID via {invoice.paymentMethod}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleCard(invoice.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>
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
                        Share
                      </Button>
                      {invoice.paymentStatus === 'pending' && !isCustomer && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleMarkAsPaid(invoice)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                      {invoice.paymentStatus === 'partial' && !isCustomer && (
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => setPaymentInvoice(invoice)}
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
              );
            })
          )}
        </div>

        {/* View Invoice Modal */}
        <ViewInvoiceModal
          invoice={viewingInvoice}
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />

        {/* Payment Modal */}
        <PaymentModal
          invoice={paymentInvoice}
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
        />
      </div>
    </DashboardLayout>
  );
}