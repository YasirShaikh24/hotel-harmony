import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Receipt, Download, Eye, CreditCard, Clock, CheckCircle, MessageCircle, CalendarIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invoicesApi, paymentsApi } from '@/services/api';
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
  checkInTime?: string;
  checkOutTime?: string;
  days: number;
  roomCharges: number;
  additionalCharges: number;
  cgst: number;
  sgst: number;
  total: number;
  totalPaid: number;
  advanceAmount?: number;
  advancePaymentMethod?: string;
  paymentStatus: string;
  paymentMethod?: string;
  invoiceDate: string;
  createdAt?: string;
  payments?: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  allInvoices?: Invoice[];
}

interface PaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'partial': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'partial': return <Clock className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    default: return <Receipt className="h-4 w-4" />;
  }
};

const formatInvoiceNumber = (invoiceId: string, invoiceDate: string, allInvoices?: Invoice[]) => {
  if (allInvoices) {
    const sortedByDate = [...allInvoices].sort((a, b) =>
      new Date(a.createdAt || a.invoiceDate).getTime() - new Date(b.createdAt || b.invoiceDate).getTime()
    );
    const index = sortedByDate.findIndex(inv => inv.id === invoiceId);
    const sequentialNumber = String(index + 1).padStart(3, '0');
    return `INV-${sequentialNumber}`;
  }
  const shortId = parseInt(invoiceId.slice(-6), 16) % 1000;
  const sequentialNumber = String(shortId).padStart(3, '0');
  return `INV-${sequentialNumber}`;
};

// ─────────────────────────────────────────────
// VIEW INVOICE MODAL
// ─────────────────────────────────────────────
function ViewInvoiceModal({ invoice, isOpen, onClose, allInvoices }: ViewInvoiceModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Fetch payment history when modal opens
  React.useEffect(() => {
    if (invoice && isOpen) {
      setLoadingPayments(true);
      paymentsApi.getByInvoiceId(invoice.id)
        .then(setPayments)
        .catch(console.error)
        .finally(() => setLoadingPayments(false));
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const currency = (num: number) =>
    'Rs.' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const invoiceNumber = formatInvoiceNumber(invoice.id, invoice.invoiceDate, allInvoices);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0 bg-white">
        <div className="p-10 bg-white text-gray-900 font-sans">
          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/hk.png"
                alt="Hotel Krishna"
                className="h-16 w-16 rounded-full object-contain border-2 border-[#1a3a5c]"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-gray-900">HOTEL KRISHNA</h1>
                <p className="text-xs text-gray-500 mt-1">1st Floor Lalita Tower, Vadodara - 390005</p>
                <p className="text-xs text-gray-500">Phone: +91 9638003036 | info@hotelkrishna.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">TAX INVOICE</h2>
              <p className="text-xs text-gray-600 mt-2">Invoice #: {invoiceNumber}</p>
              <p className="text-xs text-gray-600">Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <hr className="border-gray-300 my-6" />

          {/* BILL TO & STAY DETAILS */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
              <p className="font-semibold text-gray-900">{invoice.customerName}</p>
              {invoice.customer2Name && <p className="text-gray-700">{invoice.customer2Name}</p>}
              <p className="text-gray-600">{invoice.customerEmail}</p>
              <p className="text-gray-600">{invoice.customerPhone}</p>
              {invoice.customerGstNumber && invoice.customerGstNumber.trim() !== '' && (
                <p className="text-gray-600 mt-1">GSTIN: {invoice.customerGstNumber}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Stay Details</p>
              <p className="text-gray-700">Room: {invoice.roomNumber}</p>
              <p className="text-gray-700">Check-in: {new Date(invoice.checkIn).toLocaleDateString('en-IN')}</p>
              <p className="text-gray-700">Check-out: {new Date(invoice.checkOut).toLocaleDateString('en-IN')}</p>
              <p className="text-gray-700">Duration: {invoice.days} Night{invoice.days > 1 ? 's' : ''}</p>
            </div>
          </div>

          <hr className="border-gray-300 my-6" />

          {/* CHARGES TABLE */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 text-xs uppercase tracking-widest text-gray-400 font-medium">Description</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest text-gray-400 font-medium">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-800">Room Charges ({invoice.days} night{invoice.days > 1 ? 's' : ''})</td>
                <td className="py-3 text-right text-gray-800">{currency(invoice.roomCharges)}</td>
              </tr>
              {invoice.additionalCharges > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">Additional Charges</td>
                  <td className="py-3 text-right text-gray-800">{currency(invoice.additionalCharges)}</td>
                </tr>
              )}

              <tr className="border-t-2 border-gray-300">
                <td className="pt-4 pb-2 font-bold text-base text-gray-900">Total Amount</td>
                <td className="pt-4 pb-2 text-right font-bold text-base text-gray-900">{currency(invoice.total)}</td>
              </tr>
            </tbody>
          </table>

          {/* PAYMENT HISTORY */}
          {(invoice.advanceAmount > 0 || payments.length > 0) && (
            <>
              <hr className="border-gray-300 my-6" />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Payment History</p>
                {loadingPayments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading payments...</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Method</th>
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Description</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Show all payments from payments table */}
                      {payments.map((payment, index) => (
                        <tr key={payment.id} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
                          <td className="py-2 text-gray-700">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              payment.notes?.includes('Advance') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2 text-gray-700">{payment.notes || `Payment #${index + 1}`}</td>
                          <td className="py-2 text-right text-[#16a34a] font-medium">{currency(payment.amount)}</td>
                        </tr>
                      ))}
                      
                      {/* Total and balance rows */}
                      <tr className="border-t-2 border-gray-300 bg-green-50">
                        <td colSpan={3} className="pt-3 pb-2 font-bold text-gray-900">Total Paid</td>
                        <td className="pt-3 pb-2 text-right font-bold text-[#16a34a]">
                          {currency(payments.reduce((sum, p) => sum + p.amount, 0))}
                        </td>
                      </tr>
                      {invoice.total > payments.reduce((sum, p) => sum + p.amount, 0) && (
                        <tr className="bg-orange-50">
                          <td colSpan={3} className="py-2 font-bold text-gray-900">Balance Due</td>
                          <td className="py-2 text-right font-bold text-orange-600">
                            {currency(invoice.total - payments.reduce((sum, p) => sum + p.amount, 0))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* PAYMENT STATUS */}
          <hr className="border-gray-200 mt-6 mb-4" />
          <div className="text-sm space-y-1 text-gray-600">
            {invoice.paymentStatus === 'paid' && (
              <p className="font-bold text-[#16a34a] text-center text-base">
                ✓ FULLY PAID
              </p>
            )}
            {invoice.paymentStatus === 'partial' && (
              <p className="font-bold text-orange-500 text-center text-base">⚠ PARTIALLY PAID</p>
            )}
            {invoice.paymentStatus === 'pending' && (
              <p className="font-bold text-red-500 text-center text-base">✗ PAYMENT PENDING</p>
            )}
          </div>

          {/* FOOTER */}
          <hr className="border-gray-200 mt-8 mb-4" />
          <p className="text-center text-xs text-gray-400">Thank you for staying with Hotel Krishna.</p>

          <div className="mt-6">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// PAYMENT MODAL — FIXED
// ─────────────────────────────────────────────
function PaymentModal({ invoice, isOpen, onClose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GPay' | 'MIM'>('Cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment history when modal opens
  React.useEffect(() => {
    if (invoice && isOpen) {
      setLoadingPayments(true);
      paymentsApi.getByInvoiceId(invoice.id)
        .then(setPayments)
        .catch(console.error)
        .finally(() => setLoadingPayments(false));
    }
  }, [invoice, isOpen]);

  // Compute derived values from the invoice and payments
  const totalAmount = invoice?.total ?? 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - totalPaid);
  const canMarkAsPaid = remainingAmount <= 0;

  React.useEffect(() => {
    if (invoice) {
      setPaymentAmount(remainingAmount > 0 ? remainingAmount : 0);
    }
  }, [invoice, remainingAmount]);

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, method, amount }: { id: string; method: string; amount: number }) =>
      invoicesApi.update(id, {
        paymentMethod: method,
        paymentAmount: amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Refresh payments list
      if (invoice) {
        paymentsApi.getByInvoiceId(invoice.id)
          .then(setPayments)
          .catch(console.error);
      }
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      setPaymentAmount(0); // Reset amount for next payment
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
    if (!invoice) return;

    if (paymentAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Payment amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast({
        title: 'Invalid Amount',
        description: `Payment amount cannot exceed remaining amount (₹${remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`,
        variant: 'destructive',
      });
      return;
    }

    const finalStatus = paymentAmount >= remainingAmount ? 'paid' : 'partial';

    addPaymentMutation.mutate({
      id: invoice.id,
      method: paymentMethod,
      amount: paymentAmount,
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Summary */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Total Amount:</span>
              <span className="font-bold text-blue-600">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {loadingPayments ? (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Loading payments...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="text-green-600 font-medium">
                    ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* Payment Breakdown */}
                {payments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Payment Breakdown:</div>
                    <div className="space-y-1">
                      {payments.map((payment, index) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            {payment.notes?.includes('Advance') ? (
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                                Advance ({payment.paymentMethod})
                              </span>
                            ) : (
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                                Payment #{index + 1} ({payment.paymentMethod})
                              </span>
                            )}
                          </span>
                          <span className="text-green-600 font-medium">
                            ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Remaining:</span>
              <span className={`text-lg font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {canMarkAsPaid && (
              <div className="mt-2 text-center">
                <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ FULLY PAID
                </span>
              </div>
            )}
          </div>

          {/* Add New Payment Form */}
          {remainingAmount > 0 && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900">Add New Payment</h4>

              {/* Payment Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="paymentAmount" className="text-sm">Payment Amount (₹)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0"
                  max={remainingAmount}
                  step="0.01"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  required
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Max: ₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'GPay', 'MIM'] as const).map((method) => (
                    <label
                      key={method}
                      className={`flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'GPay' | 'MIM')}
                        className="sr-only"
                      />
                      <span className="text-lg mb-1">
                        {method === 'Cash' ? '💵' : method === 'GPay' ? '📱' : '💳'}
                      </span>
                      <span className="text-xs font-medium">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Preview */}
              {paymentAmount > 0 && (
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-sm font-medium">
                    {paymentAmount >= remainingAmount ? (
                      <span className="text-green-600">✓ This will complete the payment</span>
                    ) : (
                      <span className="text-orange-600">
                        ⚠ Partial payment of ₹{paymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </p>
                  {paymentAmount < remainingAmount && (
                    <p className="text-xs text-gray-600 mt-1">
                      Remaining after: ₹{(remainingAmount - paymentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addPaymentMutation.isPending || paymentAmount <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                >
                  {addPaymentMutation.isPending ? 'Recording...' : 'Add Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="text-sm">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* If fully paid, just show close button */}
          {remainingAmount <= 0 && (
            <div className="flex justify-center pt-2">
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// MAIN BILLING PAGE
// ─────────────────────────────────────────────
export default function Billing() {
  const { user, isCustomer } = useAuth();
  const [filter, setFilter] = useState<string>('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery.trim()); }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const customerEmail = isCustomer ? user?.email : undefined;

  const { data: allInvoices, isLoading, isFetching } = useQuery({
    queryKey: ['invoices', filter, customerEmail],
    queryFn: () => invoicesApi.getAll(filter, { 
      customerEmail,
      limit: showAllInvoices ? undefined : 100 // Limit results for better performance
    }),
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const toggleCard = (invoiceId: string) => {
    setExpandedCards(prev =>
      prev.includes(invoiceId) ? prev.filter(id => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoicesApi.update(id, { paymentStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Payment status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' });
    },
  });

  const filterInvoicesByDate = (invoicesList: Invoice[]) => {
    if (showAllInvoices) return invoicesList;
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return invoicesList.filter((invoice: Invoice) => invoice.invoiceDate === selectedDateStr);
  };

  const sortedInvoices = allInvoices ? [...allInvoices].sort((a: Invoice, b: Invoice) =>
    new Date(b.createdAt || b.invoiceDate).getTime() - new Date(a.createdAt || a.invoiceDate).getTime()
  ) : [];

  const searchFilteredInvoices = sortedInvoices.filter((invoice: Invoice) => {
    if (!debouncedSearch.trim()) return true;
    const query = debouncedSearch.toLowerCase();
    return invoice.customerName?.toLowerCase().includes(query) || 
           invoice.roomNumber?.toLowerCase().includes(query) ||
           invoice.customerPhone?.toLowerCase().includes(query) ||
           invoice.customerEmail?.toLowerCase().includes(query);
  });

  const displayInvoices = isCustomer
    ? filterInvoicesByDate(searchFilteredInvoices.filter((invoice: Invoice) => invoice.customerEmail === user?.email))
    : filterInvoicesByDate(searchFilteredInvoices);

  // ─── PDF DOWNLOAD ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async (invoice: Invoice) => {
    // Fetch payment history for the invoice
    let paymentHistory: Payment[] = [];
    try {
      paymentHistory = await paymentsApi.getByInvoiceId(invoice.id);
    } catch (error) {
      console.error('Failed to fetch payment history for PDF:', error);
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;

    const currency = (num: number) =>
      'Rs.' + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const black: [number, number, number] = [17, 24, 39];
    const darkGray: [number, number, number] = [55, 65, 81];
    const lightGray: [number, number, number] = [107, 114, 128];
    const lineGray: [number, number, number] = [200, 200, 200];
    const green: [number, number, number] = [22, 163, 74];
    const blue: [number, number, number] = [37, 99, 235];

    const invoiceNumber = formatInvoiceNumber(invoice.id, invoice.invoiceDate, allInvoices);

    const addRow = (
      label: string,
      value: number,
      color?: [number, number, number],
      prefix?: string,
      currentY?: number
    ) => {
      const y = currentY || 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...(color || darkGray));
      doc.text(label, margin, y);
      doc.text(`${prefix || ''}${currency(value)}`, pageWidth - margin, y, { align: 'right' });
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      return y + 18;
    };

    const renderPdf = () => {
      let y = margin;

      // Logo
      const logoImg = new Image();
      logoImg.src = '/hk.png';
      try {
        doc.addImage(logoImg, 'PNG', margin, y, 50, 50);
      } catch {
        doc.setFillColor(26, 58, 92);
        doc.circle(margin + 25, y + 25, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('HK', margin + 25, y + 30, { align: 'center' });
      }

      doc.setTextColor(...black);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('HOTEL KRISHNA', margin + 60, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...lightGray);
      doc.text('1st Floor Lalita Tower, Vadodara - 390005', margin + 60, y + 32);
      doc.text('Phone: +91 9638003036 | krishnahotel138@gmail.com', margin + 60, y + 44);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...black);
      doc.text('TAX INVOICE', pageWidth - margin, y + 14, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...darkGray);
      doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - margin, y + 30, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, pageWidth - margin, y + 42, { align: 'right' });

      y += 62;

      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      const col2X = margin + contentWidth / 2 + 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...lightGray);
      doc.text('BILL TO', margin, y);
      doc.text('STAY DETAILS', col2X, y);
      y += 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(invoice.customerName, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      let billY = y + 13;
      if (invoice.customer2Name) { doc.text(invoice.customer2Name, margin, billY); billY += 13; }
      doc.text(invoice.customerEmail, margin, billY); billY += 13;
      doc.text(invoice.customerPhone, margin, billY); billY += 13;
      if (invoice.customerGstNumber && invoice.customerGstNumber.trim()) {
        doc.text(`GSTIN: ${invoice.customerGstNumber}`, margin, billY); billY += 13;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      let stayY = y;
      doc.text(`Room: ${invoice.roomNumber}`, col2X, stayY); stayY += 13;
      doc.text(`Check-in: ${new Date(invoice.checkIn).toLocaleDateString('en-IN')}${invoice.checkInTime ? ` at ${invoice.checkInTime}` : ''}`, col2X, stayY); stayY += 13;
      doc.text(`Check-out: ${new Date(invoice.checkOut).toLocaleDateString('en-IN')}${invoice.checkOutTime ? ` at ${invoice.checkOutTime}` : ''}`, col2X, stayY); stayY += 13;
      doc.text(`Duration: ${invoice.days} night${invoice.days > 1 ? 's' : ''}`, col2X, stayY);

      y = Math.max(billY, stayY) + 16;

      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageWidth - margin, y);
      y += 16;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...lightGray);
      doc.text('DESCRIPTION', margin, y);
      doc.text('AMOUNT (RS.)', pageWidth - margin, y, { align: 'right' });
      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 18;

      y = addRow(`Room Charges (${invoice.days} night${invoice.days > 1 ? 's' : ''})`, invoice.roomCharges, darkGray, '', y);
      if (invoice.additionalCharges > 0) {
        y = addRow('Additional Charges', invoice.additionalCharges, darkGray, '', y);
      }

      // Payment History Section
      if (paymentHistory.length > 0) {
        y += 10;
        doc.setDrawColor(...lineGray);
        doc.setLineWidth(0.7);
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text('PAYMENT HISTORY', margin, y);
        y += 16;

        // Payment history table header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...lightGray);
        doc.text('DATE', margin, y);
        doc.text('METHOD', margin + 80, y);
        doc.text('DESCRIPTION', margin + 160, y);
        doc.text('AMOUNT (RS.)', pageWidth - margin, y, { align: 'right' });
        doc.setDrawColor(...lineGray);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 4, pageWidth - margin, y + 4);
        y += 18;

        // Payment history rows
        paymentHistory.forEach((payment) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...darkGray);
          
          const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
          
          doc.text(paymentDate, margin, y);
          doc.text(payment.paymentMethod, margin + 80, y);
          
          const description = payment.notes || 'Payment';
          const maxDescWidth = 120;
          const truncatedDesc = description.length > 20 ? description.substring(0, 17) + '...' : description;
          doc.text(truncatedDesc, margin + 160, y);
          
          doc.setTextColor(...green);
          doc.text(currency(payment.amount), pageWidth - margin, y, { align: 'right' });
          
          doc.setDrawColor(...lineGray);
          doc.setLineWidth(0.3);
          doc.line(margin, y + 4, pageWidth - margin, y + 4);
          y += 16;
        });

        // Payment totals
        const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = Math.max(0, invoice.total - totalPaid);

        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...green);
        doc.text('Total Paid:', margin, y);
        doc.text(currency(totalPaid), pageWidth - margin, y, { align: 'right' });
        y += 14;

        if (balanceDue > 0) {
          doc.setTextColor(234, 88, 12); // Orange color
          doc.text('Balance Due:', margin, y);
          doc.text(currency(balanceDue), pageWidth - margin, y, { align: 'right' });
          y += 14;
        }
      }

      if (invoice.advanceAmount != null && invoice.advanceAmount > 0 && paymentHistory.length === 0) {
        y = addRow(
          `Advance Paid${invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}`,
          invoice.advanceAmount, green, '-', y
        );
      }
      if (invoice.paymentStatus === 'paid' && invoice.paymentMethod && invoice.advanceAmount != null && invoice.advanceAmount > 0 && paymentHistory.length === 0) {
        y = addRow(`Remaining Paid (${invoice.paymentMethod})`, invoice.total - invoice.advanceAmount, green, '-', y);
      } else if (invoice.paymentStatus === 'paid' && invoice.paymentMethod && (!invoice.advanceAmount || invoice.advanceAmount === 0) && paymentHistory.length === 0) {
        y = addRow(`Full Payment (${invoice.paymentMethod})`, invoice.total, green, '-', y);
      }

      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.7);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...black);
      doc.text('Total Amount', margin, y);
      doc.text(currency(invoice.total), pageWidth - margin, y, { align: 'right' });
      y += 24;

      doc.setDrawColor(...lineGray);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);

      if (invoice.advancePaymentMethod) {
        doc.text(`Initial Payment Mode: ${invoice.advancePaymentMethod}`, margin, y);
        y += 14;
      }
      if (invoice.paymentMethod) {
        doc.text(`Final Payment Mode: ${invoice.paymentMethod}`, margin, y);
        y += 14;
      }

      // Payment Status with better formatting
      if (invoice.paymentStatus === 'paid') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...green);
        const paymentText = `FULLY PAID on ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        doc.text(paymentText, margin, y);
        y += 16;
      } else if (invoice.paymentStatus === 'partial') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 88, 12);
        doc.text('PARTIALLY PAID', margin, y);
        y += 16;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('PAYMENT PENDING', margin, y);
        y += 16;
      }

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

    const logoImg = new Image();
    logoImg.src = '/hk.png';
    logoImg.onload = renderPdf;
    logoImg.onerror = renderPdf;
  };

  // ── WHATSAPP SHARE ──
  const handleShareWhatsApp = async (invoice: Invoice) => {
    try {
      // Fetch payment history for WhatsApp message
      let paymentHistory: Payment[] = [];
      try {
        paymentHistory = await paymentsApi.getByInvoiceId(invoice.id);
      } catch (error) {
        console.error('Failed to fetch payment history for WhatsApp:', error);
      }

      const guestInfo = invoice.customer2Name
        ? `*Guests:* ${invoice.customerName} & ${invoice.customer2Name}\n`
        : `*Guest:* ${invoice.customerName}\n`;
      const gstInfo = invoice.customerGstNumber ? `GST No: ${invoice.customerGstNumber}\n` : '';
      const invoiceNumber = formatInvoiceNumber(invoice.id, invoice.invoiceDate, allInvoices);

      // Build payment breakdown
      let paymentBreakdown = '';
      if (paymentHistory.length > 0) {
        paymentBreakdown = '\n*PAYMENT HISTORY*\n';
        paymentHistory.forEach((payment, index) => {
          const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short' 
          });
          const description = payment.notes?.includes('Advance') ? 'Advance' : `Payment #${index + 1}`;
          paymentBreakdown += `${paymentDate} - ${payment.paymentMethod}: ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${description})\n`;
        });
        
        const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = Math.max(0, invoice.total - totalPaid);
        
        paymentBreakdown += `\n*Total Paid:* ₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
        if (balanceDue > 0) {
          paymentBreakdown += `*Balance Due:* ₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
        }
      } else if ((invoice.advanceAmount ?? 0) > 0) {
        paymentBreakdown = `\nAdvance Paid${invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}: ₹${(invoice.advanceAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      }

      const message =
        `*🏨 HOTEL KRISHNA - TAX INVOICE*\n\n` +
        `Invoice No: ${invoiceNumber}\n` +
        `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*GUEST INFORMATION*\n` +
        guestInfo +
        `Email: ${invoice.customerEmail}\n` +
        `Phone: ${invoice.customerPhone}\n` +
        gstInfo +
        `\n*BOOKING DETAILS*\n` +
        `Room: ${invoice.roomNumber} - ${invoice.roomType}\n` +
        `Check-in: ${new Date(invoice.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${invoice.checkInTime ? ` at ${invoice.checkInTime}` : ''}\n` +
        `Check-out: ${new Date(invoice.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${invoice.checkOutTime ? ` at ${invoice.checkOutTime}` : ''}\n` +
        `Duration: ${invoice.days} night${invoice.days > 1 ? 's' : ''}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*CHARGES BREAKDOWN*\n` +
        `Room Charges: ₹${invoice.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
        `Additional: ₹${invoice.additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*TOTAL AMOUNT: ₹${(invoice.roomCharges + invoice.additionalCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
        paymentBreakdown +
        `Payment Status: ${invoice.paymentStatus.toUpperCase()}\n\n` +
        `Thank you for choosing Hotel Krishna! 🙏`;

      let phoneNumber = invoice.customerPhone.replace(/\D/g, '');
      if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast({ title: 'Success', description: 'Opening WhatsApp to share invoice' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to share via WhatsApp', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoices...</p>
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
              {isCustomer ? 'View and download your invoices' : 'Manage billing, invoices, and payments'}
            </p>
          </div>
        </div>

        {/* Date Filter Bar */}
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
                  <div className="text-xs text-white/80 mb-0.5">{showAllInvoices ? 'All Invoices' : "Today's Invoices"}</div>
                  <div className="text-2xl font-bold text-white leading-none">{displayInvoices?.length || 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="bg-white text-[#2c4a6b] hover:bg-blue-50 font-semibold shadow-md">
                      <CalendarIcon className="h-4 w-4 mr-1" />Select Date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { if (date) { setSelectedDate(date); setShowAllInvoices(false); } }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button size="sm" onClick={() => setShowAllInvoices(!showAllInvoices)}
                  className={`font-semibold shadow-md ${showAllInvoices ? 'bg-white text-[#2c4a6b] hover:bg-blue-50' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}>
                  {showAllInvoices ? 'Today Only' : 'Show All'}
                </Button>
                <Button size="sm" onClick={() => { setSelectedDate(new Date()); setShowAllInvoices(false); }}
                  className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-semibold shadow-md">
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        {!isCustomer && (
          <div className="flex gap-2">
            <Button variant={filter === '' ? 'default' : 'outline'} onClick={() => setFilter('')}>All Invoices</Button>
            <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
              <Clock className="h-4 w-4 mr-2" />Pending
            </Button>
            <Button variant={filter === 'paid' ? 'default' : 'outline'} onClick={() => setFilter('paid')}>
              <CheckCircle className="h-4 w-4 mr-2" />Paid
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by customer name or room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <div className="space-y-4">
          {displayInvoices?.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? `No invoices match "${searchQuery}"`
                    : isCustomer
                      ? "You don't have any invoices yet."
                      : "No invoices match the current filter."}
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
                            <span>Invoice: {formatInvoiceNumber(invoice.id, invoice.invoiceDate, allInvoices)}</span>
                            <span>•</span>
                            <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                        <div className="flex items-center gap-1">
                          {getPaymentStatusIcon(invoice.paymentStatus)}
                          {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-lg">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-bold text-primary">₹{invoice.total.toLocaleString()}</span>
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>via {invoice.paymentMethod}</span>
                          {invoice.advancePaymentMethod && invoice.advanceAmount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Advance: {invoice.advancePaymentMethod}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-700 mb-3 text-sm">Guest Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex"><span className="font-medium text-gray-700 w-20">Name:</span><span className="text-gray-900">{invoice.customerName}</span></div>
                            {invoice.customer2Name && <div className="flex"><span className="font-medium text-gray-700 w-20">Guest 2:</span><span className="text-gray-900">{invoice.customer2Name}</span></div>}
                            <div className="flex"><span className="font-medium text-gray-700 w-20">Email:</span><span className="text-gray-900 break-all">{invoice.customerEmail}</span></div>
                            <div className="flex"><span className="font-medium text-gray-700 w-20">Phone:</span><span className="text-gray-900">{invoice.customerPhone}</span></div>
                            {invoice.customerGstNumber && <div className="flex"><span className="font-medium text-gray-700 w-20">GST No:</span><span className="text-gray-900 font-mono text-xs">{invoice.customerGstNumber}</span></div>}
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

                            {invoice.advanceAmount != null && invoice.advanceAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Advance Paid{invoice.advancePaymentMethod ? ` (${invoice.advancePaymentMethod})` : ''}:</span>
                                <span className="font-medium text-green-600">-₹{invoice.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {invoice.paymentStatus === 'paid' && invoice.paymentMethod && invoice.advanceAmount != null && invoice.advanceAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Remaining Paid ({invoice.paymentMethod}):</span>
                                <span className="font-medium text-green-600">-₹{(invoice.total - invoice.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="border-t pt-2 mt-2 flex justify-between">
                              <span className="font-bold text-gray-900">Total Amount:</span>
                              <span className="font-bold text-primary text-lg">₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {invoice.paymentStatus === 'paid' && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-1">
                            {invoice.advancePaymentMethod && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Initial Payment Mode:</span>
                                <span className="font-medium text-gray-800">{invoice.advancePaymentMethod}</span>
                              </div>
                            )}
                            {invoice.paymentMethod && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Final Payment Mode:</span>
                                <span className="font-medium text-gray-800">{invoice.paymentMethod}</span>
                              </div>
                            )}
                            <p className="text-sm font-semibold text-green-700 pt-1">
                              Fully Paid on {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => toggleCard(invoice.id)}>
                        {isExpanded ? <><ChevronUp className="h-4 w-4 mr-1" />Hide Details</> : <><ChevronDown className="h-4 w-4 mr-1" />Show Details</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setViewingInvoice(invoice)}>
                        <Eye className="h-4 w-4 mr-1" />View Invoice
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(invoice)}>
                        <Download className="h-4 w-4 mr-1" />Download PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleShareWhatsApp(invoice)}>
                        <MessageCircle className="h-4 w-4 mr-1" />Share
                      </Button>
                      {invoice.paymentStatus === 'pending' && !isCustomer && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setPaymentInvoice(invoice)}>
                          <CreditCard className="h-4 w-4 mr-1" />Mark as Paid
                        </Button>
                      )}
                      {invoice.paymentStatus === 'partial' && !isCustomer && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setPaymentInvoice(invoice)}>
                          <CreditCard className="h-4 w-4 mr-1" />Mark as Paid
                        </Button>
                      )}
                      {invoice.paymentStatus === 'pending' && isCustomer && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <CreditCard className="h-4 w-4 mr-1" />Pay Now
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
          allInvoices={allInvoices}
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