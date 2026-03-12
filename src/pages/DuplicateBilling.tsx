import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customersApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface DuplicateInvoiceForm {
  customerId?: string;
  customerName: string;
  customer2Name?: string;
  customerEmail: string;
  customerPhone: string;
  customerGstNumber?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  days: number;
  roomCharges: number;
  additionalCharges: number;
  cgst: number;
  sgst: number;
  advanceAmount?: number;
  advancePaymentMethod?: string;
  paymentMethod?: string;
  invoiceDate: string;
}

const formatInvoiceNumber = (invoiceId: string, invoiceDate: string) => {
  const shortId = parseInt(invoiceId.slice(-6), 16) % 1000;
  const sequentialNumber = String(shortId).padStart(3, '0');
  return `DUP-${sequentialNumber}`;
};

export default function DuplicateBilling() {
  const { toast } = useToast();

  const [invoicesList, setInvoicesList] = useState<DuplicateInvoiceForm[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<DuplicateInvoiceForm | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // ✅ Load customers from Supabase
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customersApi.getAll();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    };

    loadCustomers();
  }, []);

  const getInitialForm = (): DuplicateInvoiceForm => ({
    customerId: '',
    customerName: '',
    customer2Name: '',
    customerEmail: '',
    customerPhone: '',
    customerGstNumber: '',
    roomNumber: '',
    roomType: '',
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: '',
    checkOutTime: '',
    days: 1,
    roomCharges: undefined,
    additionalCharges: undefined,
    cgst: undefined,
    sgst: undefined,
    advanceAmount: undefined,
    advancePaymentMethod: '',
    paymentMethod: '',
    invoiceDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // ✅ When selecting a customer from dropdown
  const handleCustomerSelect = async (customerId: string) => {

  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(customerId)
  );

  if (!selectedCustomer || !currentInvoice) return;

  // Get latest booking of this customer
  const { data, error } = await supabase
  .from("bookings")
  .select("*")
  .eq("customer_id", customerId)
  .order("created_at", { ascending: false })
  .limit(1);

if (error) {
  console.error(error);
  return;
}

const booking: any = data?.[0];
let roomData = null;

  // Get room details
  if (booking?.room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("room_number, type")
      .eq("id", booking.room_id)
      .single();

    roomData = room;
  }

  // Fill invoice automatically
  setCurrentInvoice({
    ...currentInvoice,

    customerId: customerId,
    customerName: selectedCustomer.name || "",
    customerEmail: selectedCustomer.email || "",
    customerPhone: selectedCustomer.phone || "",
    customerGstNumber: selectedCustomer.gst || "",

    roomNumber: roomData?.room_number || "",
    roomType: roomData?.type || "",

    checkIn: booking?.check_in || currentInvoice.checkIn,
    checkOut: booking?.check_out || currentInvoice.checkOut,
    checkInTime: booking?.check_in_time || "",
    checkOutTime: booking?.check_out_time || "",

    advanceAmount: booking?.advance_amount || 0,
    advancePaymentMethod: booking?.advance_payment_method || ""
  });
};
  const handleNewInvoice = () => {
    setCurrentInvoice(getInitialForm());
    setEditingIndex(null);
    setIsOpen(true);
  };

  const handleEditInvoice = (index: number) => {
    setCurrentInvoice({ ...invoicesList[index] });
    setEditingIndex(index);
    setIsOpen(true);
  };

  const handleDeleteInvoice = (index: number) => {
    const newList = invoicesList.filter((_, i) => i !== index);
    setInvoicesList(newList);

    toast({
      title: 'Success',
      description: 'Invoice deleted successfully',
    });
  };

  const handleSaveInvoice = () => {
    if (!currentInvoice) return;

    // Validation
    if (!currentInvoice.customerName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Customer name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!currentInvoice.roomNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Room number is required',
        variant: 'destructive',
      });
      return;
    }

    // Calculate days
    const checkInDate = new Date(currentInvoice.checkIn);
    const checkOutDate = new Date(currentInvoice.checkOut);
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Check-out date must be after check-in date',
        variant: 'destructive',
      });
      return;
    }
 

    // Update invoice
    const updatedInvoice = {
      ...currentInvoice,
      days,
    };

    if (editingIndex !== null) {
      const newList = [...invoicesList];
      newList[editingIndex] = updatedInvoice;
      setInvoicesList(newList);
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    } else {
      setInvoicesList([...invoicesList, updatedInvoice]);
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    }

    setIsOpen(false);
    setCurrentInvoice(null);
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof DuplicateInvoiceForm, value: any) => {
    if (currentInvoice) {
      setCurrentInvoice({ ...currentInvoice, [field]: value });
    }
  };

  const toggleCard = (index: number) => {
    setExpandedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const calculateTotal = (invoice: DuplicateInvoiceForm) => {
  return (
    (invoice.roomCharges || 0) +
    (invoice.additionalCharges || 0) +
    (invoice.cgst || 0) +
    (invoice.sgst || 0)
  );
};
  // ─────────────────────────────────────────────
  // PDF DOWNLOAD — same format as Billing
  // ─────────────────────────────────────────────
  const handleDownloadPdf = (invoice: DuplicateInvoiceForm, index: number) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 45;

    const currency = (num: number) =>
      'Rs.' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    // Colour palette
    const black: [number, number, number] = [17, 24, 39];
    const darkGray: [number, number, number] = [55, 65, 81];
    const lightGray: [number, number, number] = [107, 114, 128];
    const lineGray: [number, number, number] = [200, 200, 200];
    const green: [number, number, number] = [22, 163, 74];

    const invoiceNumber = `DUP-${String(index + 1).padStart(3, '0')}`;

    const renderPdf = () => {
      let y = margin;

      // ── LOGO ──
      const logoImg = new Image();
      logoImg.src = '/hk.png';
      try {
        doc.addImage(logoImg, 'PNG', margin, y, 50, 50);
      } catch {
        // fallback circle
        doc.setFillColor(26, 58, 92);
        doc.circle(margin + 25, y + 25, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('HK', margin + 25, y + 30, { align: 'center' });
      }

      // ── HOTEL NAME ──
      doc.setTextColor(...black);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('HOTEL KRISHNA', margin + 60, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...lightGray);
      doc.text('1st Floor Lalita Tower, Vadodara - 390005', margin + 60, y + 32);
      doc.text('Phone: +91 9638003036 | krishnahotel138@gmail.com', margin + 60, y + 44);

      // ── TAX INVOICE (right) ──
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...black);
      doc.text('TAX INVOICE ', pageWidth - margin, y + 14, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...darkGray);
      doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, pageWidth - margin, y + 30, { align: 'right' });

      y += 62;

      // ── DIVIDER ──
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      // ── BILL TO / STAY DETAILS ──
      const col2X = margin + 110;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...lightGray);
      doc.text('BILL TO', margin, y);
      doc.text('STAY DETAILS', col2X, y);
      y += 14;

      // Bill To
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(invoice.customerName, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      let billY = y + 13;
      if (invoice.customer2Name) {
        doc.text(invoice.customer2Name, margin, billY);
        billY += 13;
      }
      doc.text(invoice.customerEmail, margin, billY);
      billY += 13;
      doc.text(invoice.customerPhone, margin, billY);
      billY += 13;
      if (invoice.customerGstNumber && invoice.customerGstNumber.trim()) {
        doc.text(`GSTIN: ${invoice.customerGstNumber}`, margin, billY);
      }

      // Stay Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Room: ${invoice.roomNumber}`, col2X, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Check-in: ${new Date(invoice.checkIn).toLocaleDateString('en-IN')}${invoice.checkInTime ? ` at ${invoice.checkInTime}` : ''}`,
        col2X,
        y + 13
      );
      doc.text(
        `Check-out: ${new Date(invoice.checkOut).toLocaleDateString('en-IN')}${invoice.checkOutTime ? ` at ${invoice.checkOutTime}` : ''}`,
        col2X,
        y + 26
      );

      y += 80;

      // ── CHARGES TABLE ──
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageWidth - margin, y);

      // Headers
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...black);
      doc.text('Description', margin, y);
      doc.text('Amount (Rs.)', pageWidth - margin - 10, y, { align: 'right' });

      y += 3;
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);

      const addRow = (label: string, value: number, isGreen: boolean = false) => {
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(isGreen ? green[0] : black[0], isGreen ? green[1] : black[1], isGreen ? green[2] : black[2]);
        doc.text(label, margin, y);
        doc.text((isGreen ? '-' : '') + currency(value), pageWidth - margin - 10, y, { align: 'right' });
      };

      // Room Charges
      addRow(`Room Charges (${invoice.days} night${invoice.days > 1 ? 's' : ''})`, invoice.roomCharges);

      // Additional Charges
      if (invoice.additionalCharges > 0) {
        addRow('Additional Charges', invoice.additionalCharges);
      }

      // GST (5%)
      addRow('GST (5%)', (invoice.cgst || 0) + (invoice.sgst || 0));

      // Advance Paid — green
      if (invoice.advanceAmount && invoice.advanceAmount > 0) {
        addRow(
          `Advance Paid${invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}`,
          invoice.advanceAmount,
          true
        );
      }

      // ── TOTAL ROW ──
      const total = calculateTotal(invoice);
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y + 3, pageWidth - margin, y + 3);
      y += 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...black);
      doc.text('Total Amount', margin, y);
      doc.text(currency(total), pageWidth - margin - 10, y, { align: 'right' });
      y += 24;

      // ── PAYMENT INFO ──
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);

      if (invoice.advancePaymentMethod) {
        doc.text(`Initial Payment Mode: ${invoice.advancePaymentMethod}`, margin, y);
        y += 12;
      }
      if (invoice.paymentMethod) {
        doc.text(`Final Payment Mode: ${invoice.paymentMethod}`, margin, y);
        y += 12;
      }

      // ── FOOTER ──
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      doc.text('Thank you for staying with Hotel Krishna.', pageWidth / 2, pageHeight - 26, { align: 'center' });
      doc.save(`${invoiceNumber}.pdf`);
    };

    // Trigger render (logo may already be cached)
    const logoImg = new Image();
    logoImg.src = '/hk.png';
    logoImg.onload = renderPdf;
    logoImg.onerror = renderPdf;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Duplicate Billing
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage editable invoices with PDF download
            </p>
          </div>
          <Button onClick={handleNewInvoice} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoicesList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium mb-2">No invoices created</h3>
                <p className="text-muted-foreground mb-4">
                  Click "New Invoice" button above to create your first duplicate invoice
                </p>
              </CardContent>
            </Card>
          ) : (
            invoicesList.map((invoice, index) => {
              const isExpanded = expandedCards.includes(index);
              const total = calculateTotal(invoice);

              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-bold">📋</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Room {invoice.roomNumber} - {invoice.customerName}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>Invoice: DUP-{String(index + 1).padStart(3, '0')}</span>
                            <span>•</span>
                            <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg">
                          <span className="font-bold text-primary">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-700 mb-3 text-sm">Guest Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex"><span className="font-medium text-gray-700 w-24">Name:</span><span className="text-gray-900">{invoice.customerName}</span></div>
                            {invoice.customer2Name && <div className="flex"><span className="font-medium text-gray-700 w-24">Guest 2:</span><span className="text-gray-900">{invoice.customer2Name}</span></div>}
                            <div className="flex"><span className="font-medium text-gray-700 w-24">Email:</span><span className="text-gray-900 break-all">{invoice.customerEmail}</span></div>
                            <div className="flex"><span className="font-medium text-gray-700 w-24">Phone:</span><span className="text-gray-900">{invoice.customerPhone}</span></div>
                            {invoice.customerGstNumber && <div className="flex"><span className="font-medium text-gray-700 w-24">GST No:</span><span className="text-gray-900 font-mono text-xs">{invoice.customerGstNumber}</span></div>}
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-700 mb-3 text-sm">Stay Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Room:</span>
                              <span className="text-gray-900">{invoice.roomNumber} - {invoice.roomType}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Check-in:</span>
                              <span className="text-gray-900">{new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{invoice.checkInTime && ` at ${invoice.checkInTime}`}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Check-out:</span>
                              <span className="text-gray-900">{new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{invoice.checkOutTime && ` at ${invoice.checkOutTime}`}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium text-gray-700 w-24">Duration:</span>
                              <span className="text-gray-900 font-semibold">{invoice.days} night{invoice.days > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Charges Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Room Charges ({invoice.days} night{invoice.days > 1 ? 's' : ''}):</span>
                              <span className="font-medium text-gray-900">₹{invoice.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {invoice.additionalCharges > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Additional Charges:</span>
                                <span className="font-medium text-gray-900">₹{invoice.additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-700">GST (5%):</span>
                              <span className="font-medium text-gray-900">₹{((invoice.cgst || 0) + (invoice.sgst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {invoice.advanceAmount && invoice.advanceAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Advance Paid{invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}:</span>
                                <span className="font-medium text-green-600">-₹{invoice.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 mt-2 flex justify-between">
                              <span className="font-bold text-gray-900">Total Amount:</span>
                              <span className="font-bold text-primary text-lg">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCard(index)}
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvoice(index)}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(invoice, index)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvoice(index)}
                        className="bg-red-50 hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Invoice Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Invoice' : 'Create New Invoice'}
            </DialogTitle>
          </DialogHeader>

          {currentInvoice && (
            <div className="space-y-6">
              {/* Guest Information */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Customer</Label>

                    <select
                      value={currentInvoice.customerId || ""}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Select Customer</option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone})
                        </option>
                      ))}
                    </select>

                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Customer Name *</Label>

                    <Input
                      value={currentInvoice.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Second Guest Name (Optional)</Label>
                    <Input
                      value={currentInvoice.customer2Name}
                      onChange={(e) => handleInputChange('customer2Name', e.target.value)}
                      placeholder="Enter second guest name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email *</Label>
                    <Input
                      type="email"
                      value={currentInvoice.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone *</Label>
                    <Input
                      value={currentInvoice.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">GST Number (Optional)</Label>
                    <Input
                      value={currentInvoice.customerGstNumber}
                      onChange={(e) => handleInputChange('customerGstNumber', e.target.value)}
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700">Stay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Room Number *</Label>
                    <Input
                      value={currentInvoice.roomNumber}
                      onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                      placeholder="Enter room number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Room Type</Label>
                    <Input
                      value={currentInvoice.roomType}
                      onChange={(e) => handleInputChange('roomType', e.target.value)}
                      placeholder="e.g. Deluxe, Suite"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Check-in Date *</Label>
                    <Input
                      type="date"
                      value={currentInvoice.checkIn}
                      onChange={(e) => handleInputChange('checkIn', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Check-in Time</Label>
                    <Input
                      type="time"
                      value={currentInvoice.checkInTime}
                      onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Check-out Date *</Label>
                    <Input
                      type="date"
                      value={currentInvoice.checkOut}
                      onChange={(e) => handleInputChange('checkOut', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Check-out Time</Label>
                    <Input
                      type="time"
                      value={currentInvoice.checkOutTime}
                      onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Charges */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700">Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Room Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentInvoice.roomCharges}
                      onChange={(e) => handleInputChange('roomCharges', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentInvoice.additionalCharges}
                      onChange={(e) => handleInputChange('additionalCharges', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CGST (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentInvoice.cgst}
                      onChange={(e) => handleInputChange('cgst', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SGST (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentInvoice.sgst}
                      onChange={(e) => handleInputChange('sgst', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Advance Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentInvoice.advanceAmount}
                      onChange={(e) => handleInputChange('advanceAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Advance Payment Method</Label>
                    <Input
                      value={currentInvoice.advancePaymentMethod}
                      onChange={(e) => handleInputChange('advancePaymentMethod', e.target.value)}
                      placeholder="e.g. Cash, GPay, Card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Final Payment Method</Label>
                    <Input
                      value={currentInvoice.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      placeholder="e.g. Cash, GPay, Card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Invoice Date</Label>
                    <Input
                      type="date"
                      value={currentInvoice.invoiceDate}
                      onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Total Display */}
              <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{calculateTotal(currentInvoice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveInvoice} className="bg-green-600 hover:bg-green-700">
                  {editingIndex !== null ? 'Update' : 'Create'} Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
